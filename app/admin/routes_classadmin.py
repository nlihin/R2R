import io
import csv
import zipfile
from datetime import datetime
from functools import wraps

import pandas as pd
from flask import request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app import db
from app.admin import admin_bp
from app.admin.models_admin import AdminUser, AdminClass
from app.models import Group, Question, Class_codes

def require_classadmin(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        admin_id = get_jwt_identity()
        claims = get_jwt()

        if not admin_id:
            return jsonify(msg="Invalid admin token"), 401

        role = claims.get("role")
        must_change = claims.get("must_change_password")

        admin_row = db.session.get(AdminUser, admin_id)
        if not admin_row or not admin_row.is_active:
            return jsonify(msg="Invalid admin token"), 401
        if admin_row.role != role:
            return jsonify(msg="Forbidden"), 403

        if role not in ("courseadmin", "sysadmin"):
            return jsonify(msg="Forbidden"), 403
        if must_change or admin_row.must_change_password:
            return jsonify(
                msg="must_change_password",
                code="MUST_CHANGE_PASSWORD"
            ), 403

        identity = {
            "admin_id": admin_id,
            "role": role,
            "must_change_password": False,
        }

        return f(identity, *args, **kwargs)

    return decorated


def _check_class_access(admin_id: str, class_code: str, role: str) -> bool:
    if role == "sysadmin":
        return True
    return (
        AdminClass.query.filter_by(admin_id=admin_id, class_code=class_code)
        .first()
        is not None
    )



@admin_bp.route("/my-classes", methods=["GET", "OPTIONS"])
@require_classadmin
def my_classes(identity):
    role = identity["role"]
    admin_id = identity["admin_id"]

    if role == "sysadmin":
        all_cc = Class_codes.query.order_by(Class_codes.class_code).all()
        return jsonify(data=[c.class_code for c in all_cc]), 200

    rows = (
        AdminClass.query
        .filter_by(admin_id=admin_id)
        .order_by(AdminClass.class_code)
        .all()
    )
    return jsonify(data=[r.class_code for r in rows]), 200

@admin_bp.route("/classes/<class_code>/groups", methods=["GET", "OPTIONS"])
@require_classadmin
def get_groups(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    groups = (
        Group.query.filter_by(class_code=class_code)
        .order_by(Group.number)
        .all()
    )
    return jsonify(
        data=[
            {"id": g.id, "number": g.number, "name": g.name}
            for g in groups
        ]
    ), 200


@admin_bp.route("/classes/<class_code>/groups", methods=["POST"])
@require_classadmin
def save_groups(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    rows = request.json.get("groups", [])
    numbers = [r.get("number") for r in rows]
    if len(numbers) != len(set(numbers)):
        return jsonify(msg="Group numbers must be unique within class"), 400

    incoming_ids = {r["id"] for r in rows if r.get("id")}
    existing = Group.query.filter_by(class_code=class_code).all()
    for g in existing:
        if g.id not in incoming_ids:
            db.session.delete(g)

    for row in rows:
        if row.get("id"):
            g = db.session.get(Group, row["id"])
            if g:
                g.number = row["number"]
                g.name = row["name"]
        else:
            db.session.add(
                Group(
                    number=row["number"],
                    name=row["name"],
                    class_code=class_code,
                )
            )

    db.session.commit()
    return jsonify(
        msg="Saved",
        saved_at=datetime.now().strftime("%H:%M %d.%m.%Y")
    ), 200


@admin_bp.route(
    "/classes/<class_code>/groups/csv-template",
    methods=["GET", "OPTIONS"],
)
@require_classadmin
def groups_csv_template(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["number", "name"])
    writer.writerow(["1", "Team Alpha"])
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"groups_template_{class_code}.csv",
    )


@admin_bp.route(
    "/classes/<class_code>/groups/import-csv",
    methods=["POST", "OPTIONS"],
)
@require_classadmin
def import_groups_csv(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    file = request.files.get("file")
    if not file:
        return jsonify(msg="No file"), 400

    df = pd.read_csv(file)
    if "number" not in df.columns or "name" not in df.columns:
        return jsonify(msg="CSV must have columns: number, name"), 400

    for _, row in df.iterrows():
        existing = Group.query.filter_by(
            number=int(row["number"]), class_code=class_code
        ).first()
        if existing:
            existing.name = str(row["name"])
        else:
            db.session.add(
                Group(
                    number=int(row["number"]),
                    name=str(row["name"]),
                    class_code=class_code,
                )
            )
    db.session.commit()
    return jsonify(msg=f"Imported {len(df)} rows"), 200


@admin_bp.route("/classes/<class_code>/questions", methods=["GET", "OPTIONS"])
@require_classadmin
def get_questions(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    qs = (
        Question.query.filter_by(class_code=class_code)
        .order_by(Question.number)
        .all()
    )
    return jsonify(
        data=[
            {
                "id": q.id,
                "number": q.number,
                "description": q.description,
            }
            for q in qs
        ]
    ), 200


@admin_bp.route("/classes/<class_code>/questions", methods=["POST"])
@require_classadmin
def save_questions(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    rows = request.json.get("questions", [])
    if len(rows) > 3:
        return jsonify(msg="Max 3 questions allowed"), 400

    Question.query.filter_by(class_code=class_code).delete()
    for i, row in enumerate(rows, 1):
        db.session.add(
            Question(
                number=i,
                description=row.get("description", ""),
                class_code=class_code,
            )
        )
    db.session.commit()
    return jsonify(
        msg="Saved",
        saved_at=datetime.now().strftime("%H:%M %d.%m.%Y")
    ), 200


@admin_bp.route("/classes/<class_code>/download", methods=["POST"])
@require_classadmin
def download_data(identity, class_code):
    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    datasets = request.json.get("datasets", [])
    valid = {"rate", "user", "question_answer"}
    datasets = [d for d in datasets if d in valid]
    if not datasets:
        return jsonify(msg="Select at least one dataset"), 400

    files = {}

    if "rate" in datasets:
        df = pd.read_sql(
            "SELECT * FROM rate WHERE class_code = %(cc)s",
            db.engine,
            params={"cc": class_code},
        )
        files["rate.csv"] = df.to_csv(index=False).encode("utf-8")

    if "user" in datasets:
        df = pd.read_sql(
            'SELECT u.id, u.username, u.name, u.email_address '
            'FROM "user" u '
            "JOIN participants p ON p.username = u.username "
            "WHERE p.class_code = %(cc)s",
            db.engine,
            params={"cc": class_code},
        )
        files["user.csv"] = df.to_csv(index=False).encode("utf-8")

    if "question_answer" in datasets:
        df = pd.read_sql(
            "SELECT qa.* FROM question_answer qa "
            "JOIN participants p ON p.participant_id = qa.participant_id "
            "WHERE p.class_code = %(cc)s",
            db.engine,
            params={"cc": class_code},
        )
        files["question_answer.csv"] = df.to_csv(index=False).encode("utf-8")

    if len(files) == 1:
        name, content = next(iter(files.items()))
        return send_file(
            io.BytesIO(content),
            mimetype="text/csv",
            as_attachment=True,
            download_name=name,
        )

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, content in files.items():
            zf.writestr(name, content)
    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name=f"r2r_data_{class_code}.zip",
    )
