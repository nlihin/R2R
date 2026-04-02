from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import cross_origin



from app import db
from app.admin import admin_bp
from app.admin.models_admin import AdminUser, AdminClass
from app.admin.auth_admin import verify_password, hash_password, validate_password_strength
from app.models import Class_codes
import secrets
import string




@admin_bp.route('/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def admin_login():
    if request.method == 'OPTIONS':
        return jsonify(status=200)



    admin_id = request.json.get('admin_id', '').strip()
    password = request.json.get('password', '')



    if not admin_id or len(admin_id) != 9 or not admin_id.isdigit():
        return jsonify(msg='admin_id must be 9 digits'), 400



    admin = db.session.get(AdminUser, admin_id)
    if not admin or not admin.is_active:
        return jsonify(msg='Invalid credentials'), 401



    # ===== DEV-КОСТЫЛЬ: временно пускаем courseadmin без пароля =====
    # ОРИГИНАЛ (вернуть на проде):
    # if not verify_password(admin.password_hash, password):
    #     return jsonify(msg='Invalid credentials'), 401



    if admin.role == 'sysadmin':
        if not verify_password(admin.password_hash, password):
            return jsonify(msg='Invalid credentials'), 401
    else:
        # courseadmin: пароль временно игнорируем
        pass
    # ===== КОНЕЦ КОСТЫЛЯ =====



    access_token = create_access_token(identity={
        'admin_id': admin_id,
        'role': admin.role,
        'must_change_password': admin.must_change_password
    })
    return jsonify(
        access_token=access_token,
        role=admin.role,
        must_change_password=admin.must_change_password
    ), 200




@admin_bp.route('/change-password', methods=['POST'])
@jwt_required()
@cross_origin()
def admin_change_password():
    identity = get_jwt_identity()
    admin_id = identity['admin_id']



    current = request.json.get('current_password', '')
    new_pwd = request.json.get('new_password', '')



    if not validate_password_strength(new_pwd):
        return jsonify(
            msg='Password must be 12+ chars with uppercase, lowercase, digit'
        ), 400



    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg='Admin not found'), 404



    if not verify_password(admin.password_hash, current):
        return jsonify(msg='Current password is incorrect'), 401



    admin.password_hash = hash_password(new_pwd)
    admin.must_change_password = False
    db.session.commit()
    return jsonify(msg='Password changed'), 200




@admin_bp.route('/me', methods=['GET'])
@jwt_required()
@cross_origin()
def admin_me():
    identity = get_jwt_identity()
    admin = db.session.get(AdminUser, identity['admin_id'])
    if not admin:
        return jsonify(msg='Not found'), 404
    return jsonify(
        admin_id=admin.admin_id,
        admin_username=admin.admin_username,
        role=admin.role,
        must_change_password=admin.must_change_password
    ), 200




def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))




@admin_bp.route('/admins', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
@cross_origin()
def admins():
    identity = get_jwt_identity()
    role = identity.get('role')



    if role != 'sysadmin':
        return jsonify(msg='Forbidden'), 403



    if request.method == 'OPTIONS':
        return jsonify(status=200)



    if request.method == 'GET':
        rows = AdminUser.query.order_by(AdminUser.admin_id).all()
        data = []
        for a in rows:
            data.append({
                "admin_id": a.admin_id,
                "admin_username": a.admin_username,
                "admin_email": a.admin_email,
                "role": a.role,
                "is_active": a.is_active,
                "must_change_password": a.must_change_password
            })
        return jsonify(data=data), 200



    payload = request.json or {}
    admin_username = payload.get("admin_username", "").strip()
    admin_email = payload.get("admin_email", "").strip()
    role_new = payload.get("role", "courseadmin").strip() or "courseadmin"



    if not admin_username or not admin_email:
        return jsonify(msg="admin_username and admin_email are required"), 400



    max_id = db.session.query(db.func.max(AdminUser.admin_id)).scalar()
    if max_id:
        next_int = int(max_id) + 1
    else:
        next_int = 1
    new_admin_id = f"{next_int:09d}"



    temp_password = _generate_temp_password()
    password_hash = hash_password(temp_password)



    admin = AdminUser(
        admin_id=new_admin_id,
        password_hash=password_hash,
        admin_username=admin_username,
        admin_email=admin_email,
        role=role_new,
        is_active=True,
        must_change_password=True
    )
    db.session.add(admin)
    db.session.commit()



    return jsonify(
        admin_id=new_admin_id,
        temp_password=temp_password,
        admin_username=admin_username,
        admin_email=admin_email,
        role=role_new,
        is_active=True,
        must_change_password=True
    ), 201




@admin_bp.route('/admin-classes', methods=['GET', 'POST', 'DELETE', 'OPTIONS'])
@jwt_required()
@cross_origin()
def admin_classes():
    identity = get_jwt_identity()
    role = identity.get('role')



    if role != 'sysadmin':
        return jsonify(msg='Forbidden'), 403



    if request.method == 'OPTIONS':
        return jsonify(status=200)



    if request.method == 'GET':
        rows = AdminClass.query.order_by(
            AdminClass.admin_id,
            AdminClass.class_code
        ).all()
        data = []
        for r in rows:
            data.append({
                "admin_id": r.admin_id,
                "class_code": r.class_code
            })
        return jsonify(data=data), 200



    payload = request.json or {}
    admin_id = (payload.get("admin_id") or "").strip()
    class_code = (payload.get("class_code") or "").strip()



    if not admin_id or not class_code:
        return jsonify(msg="admin_id and class_code are required"), 400



    admin = db.session.get(AdminUser, admin_id)
    if not admin:
        return jsonify(msg="Admin not found"), 404



    cc = Class_codes.query.filter_by(class_code=class_code).one_or_none()
    if not cc:
        return jsonify(msg="Class code not found"), 404



    if request.method == 'POST':
        existing = AdminClass.query.filter_by(
            admin_id=admin_id,
            class_code=class_code
        ).first()
        if existing:
            return jsonify(msg="Already assigned"), 200



        link = AdminClass(admin_id=admin_id, class_code=class_code)
        db.session.add(link)
        db.session.commit()
        return jsonify(msg="Assigned", admin_id=admin_id, class_code=class_code), 201



    if request.method == 'DELETE':
        existing = AdminClass.query.filter_by(
            admin_id=admin_id,
            class_code=class_code
        ).first()
        if not existing:
            return jsonify(msg="Not found"), 404



        db.session.delete(existing)
        db.session.commit()
        return jsonify(msg="Unassigned", admin_id=admin_id, class_code=class_code), 200
