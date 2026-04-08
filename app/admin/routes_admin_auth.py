from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.admin import admin_bp
from app.admin.models_admin import AdminUser
from app.admin.auth_admin import verify_password, hash_password, validate_password_strength


@admin_bp.route('/login', methods=['POST', 'OPTIONS'])
def admin_login():
    if request.method == 'OPTIONS':
        return jsonify(status=200), 200

    payload = request.get_json(silent=True) or {}
    admin_id = str(payload.get('admin_id', '')).strip()
    password = payload.get('password', '')

    if not admin_id or len(admin_id) != 9 or not admin_id.isdigit():
        return jsonify(msg='admin_id must be 9 digits'), 400

    admin = db.session.get(AdminUser, admin_id)
    if not admin or not admin.is_active:
        return jsonify(msg='Invalid credentials'), 401

    if not verify_password(admin.password_hash, password):
        return jsonify(msg='Invalid credentials'), 401

    access_token = create_access_token(
        identity=admin.admin_id,
        additional_claims={
            'admin_id': admin.admin_id,
            'role': admin.role,
            'must_change_password': admin.must_change_password,
        }
    )

    return jsonify(
        access_token=access_token,
        role=admin.role,
        must_change_password=admin.must_change_password,
        admin_id=admin.admin_id,
        admin_username=admin.admin_username
    ), 200


@admin_bp.route('/change-password', methods=['POST', 'OPTIONS'])
@jwt_required()
def admin_change_password():
    if request.method == 'OPTIONS':
        return jsonify(status=200), 200

    admin_id = get_jwt_identity()

    payload = request.get_json(silent=True) or {}
    current_password = payload.get('current_password', '')
    new_password = payload.get('new_password', '')

    if not validate_password_strength(new_password):
        return jsonify(
            msg='Password must be 12+ chars with uppercase, lowercase, digit'
        ), 400

    admin = db.session.get(AdminUser, admin_id)
    if not admin or not admin.is_active:
        return jsonify(msg='Admin not found'), 404

    if not verify_password(admin.password_hash, current_password):
        return jsonify(msg='Current password is incorrect'), 401

    admin.password_hash = hash_password(new_password)
    admin.must_change_password = False
    db.session.commit()

    access_token = create_access_token(
        identity=admin.admin_id,
        additional_claims={
            'admin_id': admin.admin_id,
            'role': admin.role,
            'must_change_password': admin.must_change_password,
        },
    )

    return jsonify(
        msg='Password changed',
        access_token=access_token,
        role=admin.role,
        must_change_password=admin.must_change_password,
        admin_id=admin.admin_id,
        admin_username=admin.admin_username,
    ), 200


@admin_bp.route('/me', methods=['GET', 'OPTIONS'])
@jwt_required()
def admin_me():
    if request.method == 'OPTIONS':
        return jsonify(status=200), 200

    admin_id = get_jwt_identity()
    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Not found'), 404

    return jsonify(
        admin_id=admin.admin_id,
        admin_username=admin.admin_username,
        admin_email=admin.admin_email,
        role=admin.role,
        is_active=admin.is_active,
        must_change_password=admin.must_change_password,
    ), 200