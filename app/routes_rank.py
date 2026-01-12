from flask import Blueprint, request, jsonify
from app import db
from app.models import RankNew
from flask_jwt_extended import current_user, jwt_required
from flask_cors import cross_origin
from ast import literal_eval
from app.ranking_service import RankingService


rank = Blueprint('rank', __name__)


@rank.route('/rank', methods=['OPTIONS'])
@cross_origin()
def handle_rank_options():
    return jsonify(status=200)


@rank.route('/rank', methods=['POST'])
@jwt_required()
@cross_origin()
def rank_page():
    """
    POST /rank

    БЕЗ ДАТЫ! Рейтинг сохраняется НАВСЕГДА.
    Обрабатывает список групп вида:
    {
        "list_rank": "[(43, 5), (44, 4)]"
    }
    """
    try:
        class_code = current_user.class_code
        username = current_user.username

        request_data = request.json or {}
        new_list_rank_str = request_data.get('list_rank', '[]')

        try:
            new_list_rank = literal_eval(new_list_rank_str)
        except Exception as e:
            print(f"[rank_page] Error parsing new_list_rank: {e}")
            new_list_rank = []

        print(f"\n[rank_page] Processing {len(new_list_rank)} groups")
        print(f"[rank_page] username={username}, class_code={class_code}")
        print(f"[rank_page] new_list_rank={new_list_rank}")

        # Обрабатываем каждую группу из new_list_rank через RankingService
        first_conflict = []
        for group_id, rating in new_list_rank:
            print(f"\n[rank_page] Processing group_id={group_id}, rating={rating}")

            result = RankingService.add_group_to_rank(
                username=username,
                class_code=class_code,
                group_id=int(group_id),
                rating=int(rating),
            )

            print(f"[rank_page] Result: {result}")

            if result.get("conflict"):
                first_conflict = result.get("sorted_groups", [])
                print(
                    f"[rank_page] Conflicts found, will show UI for: {first_conflict}"
                )
                break

        print(f"[rank_page] Returning conflicts: {first_conflict}")

        return jsonify(
            status=200,
            ranking={},
            conflicts=first_conflict,
            msg="Rank updated successfully",
        )

    except Exception as e:
        db.session.rollback()
        print(f"[rank_page] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(status=400, msg=f"Error: {e}"), 400
