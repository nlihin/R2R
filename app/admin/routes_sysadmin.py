import re

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps
from sqlalchemy import cast, func, Integer, inspect, text
from sqlalchemy.exc import DataError, IntegrityError, SQLAlchemyError

from app import db
from app.admin import admin_bp
from app.admin.models_admin import AdminUser, AdminClass
from app.admin.auth_admin import hash_password, generate_temp_password
from app.models import (
    Class_codes,
    Group,
    Question,
    Participant,
    Pairwise,
    RankNewItem,
)

PROTECTED_ADMIN_ID = '000000001'
CLASS_CODE_MAX_LENGTH = 10
CLASS_CODE_PATTERN = re.compile(r'^\d+$')


def require_sysadmin(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return jsonify(status=200), 200

        admin_id = get_jwt_identity()
        claims = get_jwt()

        if not admin_id:
            return jsonify(msg='Invalid admin token'), 401

        admin = db.session.get(AdminUser, admin_id)
        if not admin or not admin.is_active:
            return jsonify(msg='Invalid admin token'), 401

        if claims.get('role') != 'sysadmin' or admin.role != 'sysadmin':
            return jsonify(msg='Forbidden'), 403

        if claims.get('must_change_password') or admin.must_change_password:
            return jsonify(
                msg='must_change_password',
                code='MUST_CHANGE_PASSWORD',
            ), 403

        return f(*args, **kwargs)

    return decorated


def _count_active_sysadmins():
    return AdminUser.query.filter_by(role='sysadmin', is_active=True).count()


def _next_admin_id():
    try:
        max_numeric_id = db.session.query(
            func.max(cast(AdminUser.admin_id, Integer)),
        ).scalar()
    except DataError:
        db.session.rollback()
        raise ValueError(
            'non-numeric admin_id in database; cannot auto-increment',
        ) from None

    next_int = (max_numeric_id or 0) + 1
    if next_int > 999_999_999:
        raise ValueError('admin id limit exceeded')
    return f'{next_int:09d}'


def _normalize_bool(value, default=None):
    if isinstance(value, bool):
        return value, None
    if isinstance(value, int) and value in (0, 1):
        return bool(value), None
    if value is None:
        if default is None:
            return None, 'Invalid is_active value'
        return default, None
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in ('true', '1', 'yes', 'on'):
            return True, None
        if normalized in ('false', '0', 'no', 'off'):
            return False, None
    return None, 'Invalid is_active value'


def _delete_admin_class_assignments(admin_id):
    AdminClass.query.filter_by(admin_id=admin_id).delete(synchronize_session=False)


def _find_duplicate_email(email, exclude_admin_id=None):
    q = AdminUser.query.filter(
        func.lower(AdminUser.admin_email) == email.lower(),
    )
    if exclude_admin_id:
        q = q.filter(AdminUser.admin_id != exclude_admin_id)
    return q.first()


def _find_duplicate_username(username, exclude_admin_id=None):
    q = AdminUser.query.filter(
        func.lower(AdminUser.admin_username) == username.lower(),
    )
    if exclude_admin_id:
        q = q.filter(AdminUser.admin_id != exclude_admin_id)
    return q.first()


def _validate_admin_mutation(admin, admin_id, caller_id, new_role, new_is_active):
    if admin_id == PROTECTED_ADMIN_ID:
        if new_role != 'sysadmin':
            return jsonify(
                msg='The protected system admin must remain a sysadmin.',
            ), 403
        if not new_is_active:
            return jsonify(
                msg='The protected system admin cannot be deactivated.',
            ), 403

    if admin_id == caller_id:
        if new_role != 'sysadmin':
            return jsonify(msg='You cannot change your own role.'), 403
        if not new_is_active:
            return jsonify(msg='You cannot deactivate your own account.'), 403

    if admin.role == 'sysadmin' and admin.is_active:
        removing_sysadmin = new_role != 'sysadmin' or not new_is_active
        if removing_sysadmin and _count_active_sysadmins() <= 1:
            return jsonify(
                msg='Cannot demote or deactivate the last active sysadmin.',
            ), 409

    return None


@admin_bp.route('/admins', methods=['GET', 'POST', 'OPTIONS'])
@require_sysadmin
def admins():
    if request.method == 'GET':
        rows = AdminUser.query.order_by(AdminUser.admin_id).all()
        return jsonify(data=[{
            'admin_id': a.admin_id,
            'admin_username': a.admin_username,
            'admin_email': a.admin_email,
            'role': a.role,
            'is_active': a.is_active,
            'must_change_password': a.must_change_password
        } for a in rows]), 200

    d = request.get_json(silent=True) or {}
    admin_username = str(d.get('admin_username', '')).strip()
    admin_email = str(d.get('admin_email', '')).strip()
    role = str(d.get('role', 'courseadmin')).strip() or 'courseadmin'

    if not admin_username or not admin_email:
        return jsonify(msg='admin_username and admin_email are required'), 400

    if role not in ('sysadmin', 'courseadmin'):
        return jsonify(msg='Invalid role'), 400

    if _find_duplicate_email(admin_email):
        return jsonify(msg='An admin with this email already exists.'), 409

    if _find_duplicate_username(admin_username):
        return jsonify(msg='An admin with this username already exists.'), 409

    try:
        new_admin_id = _next_admin_id()
    except ValueError as e:
        return jsonify(msg=str(e)), 500

    temp_pwd = generate_temp_password()

    admin = AdminUser(
        admin_id=new_admin_id,
        password_hash=hash_password(temp_pwd),
        admin_username=admin_username,
        admin_email=admin_email,
        role=role,
        is_active=True,
        must_change_password=True
    )

    db.session.add(admin)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg='Could not create admin due to a database constraint.'), 409
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while creating admin.'), 500

    return jsonify(
        admin_id=new_admin_id,
        admin_username=admin_username,
        admin_email=admin_email,
        role=role,
        is_active=True,
        must_change_password=True,
        temp_password=temp_pwd
    ), 201


@admin_bp.route('/admins/<admin_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@require_sysadmin
def update_admin(admin_id):
    if request.method == 'DELETE':
        caller_id = get_jwt_identity()
        admin = db.session.get(AdminUser, admin_id)
        if not admin:
            return jsonify(msg='Not found'), 404

        if admin_id == caller_id:
            return jsonify(msg='You cannot delete your own admin account.'), 403

        if admin_id == PROTECTED_ADMIN_ID:
            return jsonify(msg='This admin account is protected and cannot be deleted.'), 403

        if admin.role == 'sysadmin' and admin.is_active:
            if _count_active_sysadmins() <= 1:
                return jsonify(msg='Cannot delete the last active sysadmin.'), 409

        deleted_summary = {
            'admin_id': admin.admin_id,
            'admin_username': admin.admin_username,
            'role': admin.role,
        }

        try:
            _delete_admin_class_assignments(admin_id)
            db.session.delete(admin)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify(
                msg='Could not delete admin due to related data.',
            ), 409
        except SQLAlchemyError:
            db.session.rollback()
            return jsonify(msg='Database error while deleting admin.'), 500

        return jsonify(
            msg='Admin deleted successfully.',
            **deleted_summary,
        ), 200

    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404

    caller_id = get_jwt_identity()
    d = request.get_json(silent=True) or {}

    admin_username = str(d.get('admin_username', admin.admin_username)).strip()
    admin_email = str(d.get('admin_email', admin.admin_email)).strip()
    role = str(d.get('role', admin.role)).strip()

    if 'is_active' in d:
        is_active, bool_err = _normalize_bool(d.get('is_active'))
        if bool_err:
            return jsonify(msg=bool_err), 400
    else:
        is_active = admin.is_active

    if not admin_username or not admin_email:
        return jsonify(msg='admin_username and admin_email are required'), 400

    if role not in ('sysadmin', 'courseadmin'):
        return jsonify(msg='Invalid role'), 400

    mutation_error = _validate_admin_mutation(
        admin, admin_id, caller_id, role, is_active,
    )
    if mutation_error:
        return mutation_error

    if _find_duplicate_email(admin_email, exclude_admin_id=admin_id):
        return jsonify(msg='An admin with this email already exists.'), 409

    if _find_duplicate_username(admin_username, exclude_admin_id=admin_id):
        return jsonify(msg='An admin with this username already exists.'), 409

    admin.admin_username = admin_username
    admin.admin_email = admin_email
    admin.role = role
    admin.is_active = is_active

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg='Could not update admin due to a database constraint.'), 409
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while updating admin.'), 500

    return jsonify(msg='Updated'), 200


@admin_bp.route('/admins/<admin_id>/reset-password', methods=['POST', 'OPTIONS'])
@require_sysadmin
def reset_admin_password(admin_id):
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404

    caller_id = get_jwt_identity()
    if admin_id == PROTECTED_ADMIN_ID and caller_id != PROTECTED_ADMIN_ID:
        return jsonify(
            msg='Only the protected admin account can reset its own password.',
        ), 403

    temp_pwd = generate_temp_password()
    admin.password_hash = hash_password(temp_pwd)
    admin.must_change_password = True
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while resetting password.'), 500

    return jsonify(
        admin_id=admin.admin_id,
        temp_password=temp_pwd,
        must_change_password=True
    ), 200


@admin_bp.route('/admin-classes', methods=['GET', 'POST', 'OPTIONS'])
@require_sysadmin
def admin_classes():
    if request.method == 'GET':
        rows = AdminClass.query.order_by(AdminClass.admin_id, AdminClass.class_code).all()
        return jsonify(data=[{
            'admin_id': r.admin_id,
            'class_code': r.class_code
        } for r in rows]), 200

    d = request.get_json(silent=True) or {}
    admin_id = str(d.get('admin_id', '')).strip()
    class_code = str(d.get('class_code', '')).strip()

    if not admin_id or not class_code:
        return jsonify(msg='admin_id and class_code are required'), 400

    if not db.session.get(AdminUser, admin_id):
        return jsonify(msg='Admin not found'), 404

    if not Class_codes.query.filter_by(class_code=class_code).first():
        return jsonify(msg='Class code not found'), 404

    existing = AdminClass.query.filter_by(admin_id=admin_id, class_code=class_code).first()
    if existing:
        return jsonify(msg='Already assigned'), 409

    db.session.add(AdminClass(admin_id=admin_id, class_code=class_code))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg='Could not assign class due to a database constraint.'), 409
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while assigning class.'), 500

    return jsonify(msg='Assigned', admin_id=admin_id, class_code=class_code), 201


@admin_bp.route('/admin-classes/<admin_id>/<class_code>', methods=['DELETE', 'OPTIONS'])
@require_sysadmin
def remove_class_assignment(admin_id, class_code):
    row = AdminClass.query.filter_by(admin_id=admin_id, class_code=class_code).first()
    if not row:
        return jsonify(msg='Not found'), 404

    db.session.delete(row)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while removing assignment.'), 500

    return jsonify(msg='Removed', admin_id=admin_id, class_code=class_code), 200


def _normalize_class_code(raw):
    return str(raw or '').strip()


def _validate_class_code(class_code):
    if not class_code:
        return 'class_code is required'
    if len(class_code) > CLASS_CODE_MAX_LENGTH:
        return (
            f'class_code must be at most {CLASS_CODE_MAX_LENGTH} characters'
        )
    if not CLASS_CODE_PATTERN.match(class_code):
        return 'class_code must contain digits only (no spaces or letters)'
    return None


def _legacy_crowd_rating_uses_class_code(class_code):
    try:
        inspector = inspect(db.engine)
        if 'crowd_rating' not in inspector.get_table_names():
            return False
        column_names = {
            col['name'] for col in inspector.get_columns('crowd_rating')
        }
        if 'class_code' not in column_names:
            return False
        row = db.session.execute(
            text(
                'SELECT 1 FROM crowd_rating WHERE class_code = :class_code '
                'LIMIT 1'
            ),
            {'class_code': class_code},
        ).first()
        return row is not None
    except SQLAlchemyError:
        raise


def _class_code_delete_block(class_code):
    if AdminClass.query.filter_by(class_code=class_code).first():
        return 'Cannot delete class code because it is assigned to admins.'
    if Group.query.filter_by(class_code=class_code).first():
        return 'Cannot delete class code because it is already used in groups.'
    if Question.query.filter_by(class_code=class_code).first():
        return 'Cannot delete class code because it is already used in questions.'
    if Participant.query.filter_by(class_code=class_code).first():
        return 'Cannot delete class code because it is already used in participants.'
    if Pairwise.query.filter_by(class_code=class_code).first():
        return 'Cannot delete class code because it is already used in pairwise data.'
    if RankNewItem.query.filter_by(class_code=class_code).first():
        return 'Cannot delete class code because it is already used in rankings.'
    if _legacy_crowd_rating_uses_class_code(class_code):
        return (
            'Cannot delete class code because it is already used in legacy '
            'crowd rating data.'
        )
    return None


@admin_bp.route('/classes', methods=['GET', 'POST', 'OPTIONS'])
@require_sysadmin
def manage_class_codes():
    if request.method == 'GET':
        rows = Class_codes.query.order_by(Class_codes.class_code).all()
        return jsonify(data=[{
            'class_code': row.class_code,
            'bts_enabled': row.bts_enabled,
        } for row in rows]), 200

    d = request.get_json(silent=True) or {}
    class_code = _normalize_class_code(d.get('class_code'))

    class_code_err = _validate_class_code(class_code)
    if class_code_err:
        return jsonify(msg=class_code_err), 400

    if Class_codes.query.filter_by(class_code=class_code).first():
        return jsonify(msg='Class code already exists'), 409

    if 'bts_enabled' in d:
        bts_enabled, bool_err = _normalize_bool(d.get('bts_enabled'))
        if bool_err:
            return jsonify(msg='Invalid bts_enabled value'), 400
    else:
        bts_enabled = True

    row = Class_codes(class_code=class_code, bts_enabled=bts_enabled)
    db.session.add(row)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg='Class code already exists'), 409
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while creating class code.'), 500

    return jsonify(class_code=class_code, bts_enabled=bts_enabled), 201


@admin_bp.route('/classes/<class_code>', methods=['DELETE', 'OPTIONS'])
@require_sysadmin
def delete_class_code(class_code):
    row = Class_codes.query.filter_by(class_code=class_code).first()
    if not row:
        return jsonify(msg='Not found'), 404

    try:
        block_msg = _class_code_delete_block(class_code)
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(
            msg='Database error while checking class code dependencies.',
        ), 500

    if block_msg:
        return jsonify(msg=block_msg), 409

    db.session.delete(row)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg='Cannot delete class code due to related data.'), 409
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify(msg='Database error while deleting class code.'), 500

    return jsonify(msg='Deleted', class_code=class_code), 200


@admin_bp.route('/available-classes', methods=['GET', 'OPTIONS'])
@require_sysadmin
def available_classes():
    all_classes = Class_codes.query.order_by(Class_codes.class_code).all()
    return jsonify(data=[c.class_code for c in all_classes]), 200
