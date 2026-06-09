import io
import csv
import zipfile
from datetime import datetime
from functools import wraps

import pandas as pd
from flask import request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import IntegrityError

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

        admin_row = db.session.get(AdminUser, admin_id)
        if not admin_row or not admin_row.is_active:
            return jsonify(msg="Invalid admin token"), 401
        if admin_row.role != role:
            return jsonify(msg="Forbidden"), 403

        if role not in ("courseadmin", "sysadmin"):
            return jsonify(msg="Forbidden"), 403
        if admin_row.must_change_password:
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


@admin_bp.route(
    "/classes/<class_code>/settings",
    methods=["GET", "POST", "OPTIONS"],
)
@require_classadmin
def class_settings(identity, class_code):
    if request.method == "OPTIONS":
        return jsonify(status=200), 200

    admin_id = identity["admin_id"]
    role = identity["role"]

    if not _check_class_access(admin_id, class_code, role):
        return jsonify(msg="Forbidden"), 403

    row = Class_codes.query.filter_by(class_code=class_code).first()
    if not row:
        return jsonify(msg="Class not found"), 404

    if request.method == "GET":
        return jsonify(bts_enabled=bool(row.bts_enabled)), 200

    body = request.get_json(silent=True) or {}
    if "bts_enabled" not in body:
        return jsonify(msg="Missing bts_enabled"), 400

    val = body["bts_enabled"]
    if not isinstance(val, bool):
        return jsonify(msg="bts_enabled must be a boolean"), 400

    row.bts_enabled = val
    db.session.commit()

    return jsonify(msg="Saved", bts_enabled=bool(row.bts_enabled)), 200


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
    if not isinstance(rows, list):
        return jsonify(msg="groups must be a list"), 400

    normalized = []
    for i, r in enumerate(rows):
        if not isinstance(r, dict):
            return jsonify(msg=f"Invalid row at index {i}"), 400
        num, name = r.get("number"), r.get("name")
        if num is None or name is None or not str(name).strip():
            return jsonify(msg="Each group needs a number and a non-empty name"), 400
        try:
            num_int = int(num)
        except (TypeError, ValueError):
            return jsonify(msg="Group number must be an integer"), 400
        raw_id = r.get("id")
        if raw_id is not None:
            try:
                row_id = int(raw_id)
            except (TypeError, ValueError):
                return jsonify(msg="Invalid group id"), 400
        else:
            row_id = None
        normalized.append(
            {"id": row_id, "number": num_int, "name": str(name).strip()}
        )

    numbers = [x["number"] for x in normalized]
    if len(numbers) != len(set(numbers)):
        return jsonify(msg="Group numbers must be unique within class"), 400

    incoming_ids = {x["id"] for x in normalized if x["id"] is not None}
    existing = Group.query.filter_by(class_code=class_code).all()
    for g in existing:
        if g.id not in incoming_ids:
            db.session.delete(g)

    db.session.flush()

    by_id = {}
    for row in normalized:
        if row["id"] is None:
            continue
        g = db.session.get(Group, row["id"])
        if not g or g.class_code != class_code:
            return jsonify(
                msg="Unknown or out-of-scope group id for this class"
            ), 400
        by_id[row["id"]] = g

    # Avoid unique (number, class_code) violations when renumbering (e.g. swaps)
    for row in normalized:
        if row["id"] is None:
            continue
        by_id[row["id"]].number = -by_id[row["id"]].id

    db.session.flush()

    for row in normalized:
        if row["id"] is not None:
            g = by_id[row["id"]]
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

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(
            msg="Could not save groups (duplicate number or data conflict)"
        ), 400

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

    groups = (
        Group.query.filter_by(class_code=class_code)
        .order_by(Group.number)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["number", "name"])
    for g in groups:
        writer.writerow([g.number, g.name])
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"groups_{class_code}.csv",
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

    valid_datasets = {
        "crowd_rating",
        "pairwise",
        "question_answer",
        "rank_new_items",
    }
    datasets = request.json.get("datasets", [])
    datasets = [d for d in datasets if d in valid_datasets]
    if not datasets:
        return jsonify(msg="Select at least one dataset"), 400

    params = {"cc": class_code}
    files = {}

    df_participants = pd.read_sql(
        "SELECT * FROM participants WHERE class_code = %(cc)s",
        db.engine,
        params=params,
    )
    files["participants.csv"] = df_participants.to_csv(index=False).encode("utf-8")

    if "question_answer" in datasets:
        df = pd.read_sql(
            "SELECT qa.* FROM question_answer qa "
            "INNER JOIN participants p ON p.participant_id = qa.participant_id "
            "WHERE p.class_code = %(cc)s",
            db.engine,
            params=params,
        )
        files["question_answer.csv"] = df.to_csv(index=False).encode("utf-8")

    if "crowd_rating" in datasets:
        df = pd.read_sql(
            "SELECT cr.* FROM crowd_rating cr "
            "INNER JOIN participants p ON p.participant_id = cr.participant_id "
            "WHERE p.class_code = %(cc)s",
            db.engine,
            params=params,
        )
        files["crowd_rating.csv"] = df.to_csv(index=False).encode("utf-8")

    if "rank_new_items" in datasets:
        df = pd.read_sql(
            "SELECT rni.* FROM rank_new_items rni "
            "INNER JOIN participants p ON p.participant_id = rni.participant_id "
            "WHERE p.class_code = %(cc)s",
            db.engine,
            params=params,
        )
        files["rank_new_items.csv"] = df.to_csv(index=False).encode("utf-8")

    if "pairwise" in datasets:
        df = pd.read_sql(
            "SELECT pw.* FROM pairwise pw "
            "INNER JOIN participants p ON p.participant_id = pw.participant_id "
            "WHERE p.class_code = %(cc)s AND pw.class_code = %(cc)s",
            db.engine,
            params=params,
        )
        files["pairwise.csv"] = df.to_csv(index=False).encode("utf-8")

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
