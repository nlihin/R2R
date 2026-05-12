from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps

from app import db
from app.admin import admin_bp
from app.admin.models_admin import AdminUser, AdminClass
from app.admin.auth_admin import hash_password, generate_temp_password
from app.models import Class_codes


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

    max_id = db.session.query(db.func.max(AdminUser.admin_id)).scalar()
    next_int = int(max_id) + 1 if max_id else 1
    new_admin_id = f"{next_int:09d}"

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
    db.session.commit()

    return jsonify(
        admin_id=new_admin_id,
        admin_username=admin_username,
        admin_email=admin_email,
        role=role,
        is_active=True,
        must_change_password=True,
        temp_password=temp_pwd
    ), 201


@admin_bp.route('/admins/<admin_id>', methods=['PUT', 'OPTIONS'])
@require_sysadmin
def update_admin(admin_id):
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404

    d = request.get_json(silent=True) or {}

    admin_username = str(d.get('admin_username', admin.admin_username)).strip()
    admin_email = str(d.get('admin_email', admin.admin_email)).strip()
    role = str(d.get('role', admin.role)).strip()
    is_active = d.get('is_active', admin.is_active)

    if not admin_username or not admin_email:
        return jsonify(msg='admin_username and admin_email are required'), 400

    if role not in ('sysadmin', 'courseadmin'):
        return jsonify(msg='Invalid role'), 400

    admin.admin_username = admin_username
    admin.admin_email = admin_email
    admin.role = role
    admin.is_active = bool(is_active)

    db.session.commit()
    return jsonify(msg='Updated'), 200


@admin_bp.route('/admins/<admin_id>/reset-password', methods=['POST', 'OPTIONS'])
@require_sysadmin
def reset_admin_password(admin_id):
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404

    temp_pwd = generate_temp_password()
    admin.password_hash = hash_password(temp_pwd)
    admin.must_change_password = True
    db.session.commit()

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
    db.session.commit()

    return jsonify(msg='Assigned', admin_id=admin_id, class_code=class_code), 201


@admin_bp.route('/admin-classes/<admin_id>/<class_code>', methods=['DELETE', 'OPTIONS'])
@require_sysadmin
def remove_class_assignment(admin_id, class_code):
    row = AdminClass.query.filter_by(admin_id=admin_id, class_code=class_code).first()
    if not row:
        return jsonify(msg='Not found'), 404

    db.session.delete(row)
    db.session.commit()

    return jsonify(msg='Removed', admin_id=admin_id, class_code=class_code), 200


@admin_bp.route('/available-classes', methods=['GET', 'OPTIONS'])
@require_sysadmin
def available_classes():
    all_classes = Class_codes.query.order_by(Class_codes.class_code).all()
    return jsonify(data=[c.class_code for c in all_classes]), 200