from flask import Blueprint, request, jsonify
from app import db
from app.models import Rank
from flask_jwt_extended import current_user, jwt_required
from ast import literal_eval
from datetime import datetime


rank = Blueprint('rank', __name__)


@rank.route('/rank', methods=['POST'])
@jwt_required()
def rank_page():
    class_code = current_user.class_code
    today = datetime.today().date()
    
    new_list_rank_str = request.json.get('list_rank', '[]')
    try:
        new_list_rank = literal_eval(new_list_rank_str)
    except Exception as e:
        print(f"Error parsing new_list_rank: {e}")
        new_list_rank = []
    
    user_rank = Rank.query.filter_by(
        username=current_user.username,
        date=today,
        class_code=class_code
    ).first()
    
    if user_rank:

        try:
            old_list_rank = literal_eval(user_rank.list_rank) if user_rank.list_rank else []
        except Exception as e:
            print(f"Error parsing old_list_rank: {e}")
            old_list_rank = []

        combined_dict = {}
        
        for group_num, rating in old_list_rank:
            combined_dict[group_num] = rating

        for group_num, rating in new_list_rank:
            if group_num not in combined_dict:
                combined_dict[group_num] = rating
            else:
                combined_dict[group_num] = max(combined_dict[group_num], rating)
        
        combined_list = sorted(
            [(k, v) for k, v in combined_dict.items()],
            key=lambda x: x[1],
            reverse=True
        )
        
        user_rank.list_rank = repr(combined_list)
        
        new_questions_count = request.json.get('number_questions', 0)
        user_rank.number_questions += new_questions_count
        
        db.session.commit()
        
        print(f"Updated rank for {current_user.username} (class {class_code}):")
        print(f"  Old count: {user_rank.number_questions - new_questions_count}")
        print(f"  New questions: {new_questions_count}")
        print(f"  Total: {user_rank.number_questions}")
        print(f"  Combined list size: {len(combined_list)}")
        
    else:        
        new_rank = Rank(
            username=current_user.username,
            date=today,
            class_code=class_code,
            list_rank=repr(new_list_rank),
            number_questions=request.json.get('number_questions', 0)
        )
        db.session.add(new_rank)
        db.session.commit()
        
        print(f"Created new rank for {current_user.username} (class {class_code}):")
        print(f"  Date: {today}")
        print(f"  Questions: {request.json.get('number_questions', 0)}")
        print(f"  List size: {len(new_list_rank)}")
    
    return jsonify(status=200)
