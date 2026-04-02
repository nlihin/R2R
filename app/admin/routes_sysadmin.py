from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
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
        identity = get_jwt_identity()
        if identity.get('role') != 'sysadmin':
            return jsonify(msg='Forbidden'), 403
        return f(*args, **kwargs)
    return decorated


# --- Admin Users CRUD ---

@admin_bp.route('/admins', methods=['GET'])
@require_sysadmin
@cross_origin()
def list_admins():
    admins = AdminUser.query.all()
    return jsonify(data=[{
        'admin_id': a.admin_id,
        'admin_username': a.admin_username,
        'admin_email': a.admin_email,
        'role': a.role,
        'is_active': a.is_active
    } for a in admins]), 200


@admin_bp.route('/admins', methods=['POST'])
@require_sysadmin
@cross_origin()
def create_admin():
    d = request.json
    admin_id = str(d.get('admin_id', '')).strip()
    if len(admin_id) != 9 or not admin_id.isdigit():
        return jsonify(msg='admin_id must be 9 digits'), 400

    if db.session.get(AdminUser, admin_id):
        return jsonify(msg='Admin ID already exists'), 409

    temp_pwd = generate_temp_password()
    admin = AdminUser(
        admin_id=admin_id,
        password_hash=hash_password(temp_pwd),
        admin_username=d.get('admin_username', ''),
        admin_email=d.get('admin_email', ''),
        role=d.get('role', 'courseadmin'),
        is_active=True,
        must_change_password=True
    )
    db.session.add(admin)
    db.session.commit()
    return jsonify(admin_id=admin_id, temp_password=temp_pwd), 201


@admin_bp.route('/admins/<admin_id>', methods=['PUT'])
@require_sysadmin
@cross_origin()
def update_admin(admin_id):
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404
    d = request.json
    admin.admin_username = d.get('admin_username', admin.admin_username)
    admin.admin_email = d.get('admin_email', admin.admin_email)
    admin.role = d.get('role', admin.role)
    admin.is_active = d.get('is_active', admin.is_active)
    db.session.commit()
    return jsonify(msg='Updated'), 200


@admin_bp.route('/admins/<admin_id>/reset-password', methods=['POST'])
@require_sysadmin
@cross_origin()
def reset_admin_password(admin_id):
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404
    temp_pwd = generate_temp_password()
    admin.password_hash = hash_password(temp_pwd)
    admin.must_change_password = True
    db.session.commit()
    return jsonify(temp_password=temp_pwd), 200


# --- Admin-Class assignments ---

@admin_bp.route('/admin-classes', methods=['GET'])
@require_sysadmin
@cross_origin()
def list_admin_classes():
    rows = AdminClass.query.all()
    return jsonify(data=[{'admin_id': r.admin_id, 'class_code': r.class_code} for r in rows]), 200


@admin_bp.route('/admin-classes', methods=['POST'])
@require_sysadmin
@cross_origin()
def assign_class():
    d = request.json
    admin_id = d.get('admin_id')
    class_code = d.get('class_code')
    if not db.session.get(AdminUser, admin_id):
        return jsonify(msg='Admin not found'), 404
    if not Class_codes.query.filter_by(class_code=class_code).first():
        return jsonify(msg='Class code not found'), 404
    existing = AdminClass.query.filter_by(admin_id=admin_id, class_code=class_code).first()
    if existing:
        return jsonify(msg='Already assigned'), 409
    db.session.add(AdminClass(admin_id=admin_id, class_code=class_code))
    db.session.commit()
    return jsonify(msg='Assigned'), 201


@admin_bp.route('/admin-classes/<admin_id>/<class_code>', methods=['DELETE'])
@require_sysadmin
@cross_origin()
def remove_class_assignment(admin_id, class_code):
    row = AdminClass.query.filter_by(admin_id=admin_id, class_code=class_code).first()
    if not row:
        return jsonify(msg='Not found'), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify(msg='Removed'), 200


@admin_bp.route('/available-classes', methods=['GET'])
@require_sysadmin
@cross_origin()
def available_classes():
    all_classes = Class_codes.query.all()
    return jsonify(data=[c.class_code for c in all_classes]), 200
