from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from flask_jwt_extended import current_user, jwt_required

from app import db
from app.models import (
    Group,
    Rate,
    Question,
    CrowdRating,
    QuestionAnswer,
    Pairwise,
    RankNew,
    RankNewItem,
)
from app.ranking_service import RankingService

rate = Blueprint("rate", __name__)


@rate.route("/rate", methods=["OPTIONS"])
@cross_origin()
def handle_rate_options():
    return jsonify(status=200)


@rate.route("/rate", methods=["GET"])
@jwt_required()
@cross_origin()
def get_groups():

    group_number = request.args.get("group_number")
    class_code = current_user.class_code

    group = (
        db.session.query(Group)
        .filter_by(number=group_number, class_code=class_code)
        .one_or_none()
    )
    if not group:
        return jsonify(status=400, msg="Group not registered")

    questions = {q.number: q.description for q in Question.query.all()}

    return jsonify(
        status=200,
        data={"group_name": group.name, "questions": questions},
    )


@rate.route("/rate", methods=["POST"])
@jwt_required()
@cross_origin()
def rate_page():
    try:
        body = request.get_json(silent=True) or {}
        data = body.get("data")
        if not data:
            return jsonify(status=400, msg="Missing 'data' in request"), 400

        group_number = data.get("group_number")
        rating = data.get("rate")
        feedback = data.get("feedback12")
        answers = data.get("answer") or {}
        crowd_ratings = data.get("crowd_ratings") or {}
        class_code = current_user.class_code
        username = str(current_user.username)

        if group_number is None or rating is None or not answers or not crowd_ratings:
            return jsonify(status=400, msg="Missing required fields"), 400

        # ---------- 1. Rate ----------
        existing_rate = Rate.query.filter_by(
            username=username,
            group_number=group_number,
            class_code=class_code,
        ).first()

        if not existing_rate:
            rate_row = Rate(
                username=username,
                group_number=group_number,
                class_code=class_code,
                datetime=datetime.now(),
                rate=rating,
                feedback=feedback,
            )
            db.session.add(rate_row)

        # ---------- 2. CrowdRating ----------
        existing_crowd = CrowdRating.query.filter_by(
            username=username,
            group_number=group_number,
            class_code=class_code,
        ).first()

        if not existing_crowd:
            cr = CrowdRating(
                username=username,
                group_number=group_number,
                class_code=class_code,
                outstanding=crowd_ratings.get("outstanding", 0),
                very_good=crowd_ratings.get("very_good", 0),
                good=crowd_ratings.get("good", 0),
                fair=crowd_ratings.get("fair", 0),
                needs_improvement=crowd_ratings.get("needs_improvement", 0),
            )
            db.session.add(cr)

        # ---------- 3. QuestionAnswer ----------
        all_questions = Question.query.all()
        for q in all_questions:
            q_existing = QuestionAnswer.query.filter_by(
                user_id=int(username),
                question_number=q.number,
                group_number=group_number,
                class_code=class_code,
            ).first()
            if q_existing:
                continue
            if str(q.number) not in answers:
                continue
            qa = QuestionAnswer(
                user_id=int(username),
                question_number=q.number,
                answer=answers[str(q.number)],
                group_number=int(group_number),
                class_code=class_code,
            )
            db.session.add(qa)

        db.session.commit()

        # ---------- 4. RankingService: hash + conflicts ----------
        RankingService.load_user_rank_cache(
            username=username,
            class_code=class_code,
        )

        result = RankingService.add_group_to_rank(
            username=username,
            class_code=class_code,
            group_id=int(group_number),
            rating=int(rating),
        )

        if result["existing"]:
            return jsonify(
                status=200,
                ranking=False,
                message="Group already rated",
            )

        if result["conflict"]:
            return jsonify(
                status=200,
                ranking=True,
                conflicts=result["sorted_groups"],
            )

        return jsonify(
            status=200,
            ranking=False,
            message="Group rated successfully",
        )
    except Exception as exc:
        db.session.rollback()
        print(f"[rate_page] ERROR: {exc}")
        import traceback
        traceback.print_exc()
        return jsonify(status=400, msg=f"Error: {exc}"), 400


@rate.route("/pairwise", methods=["POST"])
@jwt_required()
@cross_origin()
def save_pairwise():
    try:
        data = request.get_json(silent=True) or {}
        class_code = data.get("class_code")
        pairwise_q = data.get("pairwise_q")
        answer = data.get("answer")
        ask_time_raw = data.get("ask_time")
        answer_time_raw = data.get("answer_time")

        if not (class_code and pairwise_q and answer and ask_time_raw and answer_time_raw):
            return jsonify(status=400, msg="Missing required fields"), 400

        ask_time = datetime.fromisoformat(ask_time_raw.replace("Z", "+00:00"))
        answer_time = datetime.fromisoformat(answer_time_raw.replace("Z", "+00:00"))

        row = Pairwise(
            class_code=class_code,
            username=int(current_user.username),
            pairwise_q=pairwise_q,
            answer=answer,
            ask_time=ask_time,
            answer_time=answer_time,
        )
        db.session.add(row)
        db.session.commit()

        return jsonify(status=200, msg="Pairwise saved", id=row.id), 200
    except Exception as exc:
        db.session.rollback()
        return jsonify(status=400, msg=str(exc)), 400
