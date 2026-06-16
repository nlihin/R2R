from flask import Blueprint, jsonify
from app.models import Group, Participant, RankNewItem
from flask_jwt_extended import current_user, jwt_required
from flask_cors import cross_origin


group = Blueprint('group', __name__)


@group.route('/group', methods=['OPTIONS'])
@cross_origin()
def handle_group_options():
    """Handle CORS preflight request"""
    return jsonify(status=200)


@group.route('/group', methods=['GET'])
@jwt_required()
@cross_origin()
def get_rating_info():
    classCode = current_user.class_code
    currentUser = current_user.username
    groups = Group.query.filter_by(class_code=classCode).all()

    participant = Participant.query.filter_by(
        username=str(currentUser), class_code=classCode
    ).first()

    rated_group_ids = set()
    if participant:
        rated_group_ids = {
            item.group_id
            for item in RankNewItem.query.filter_by(
                participant_id=participant.participant_id
            ).all()
        }

    group_info = {str(g.number): (g.id in rated_group_ids) for g in groups}

    group_info['class_code'] = str(classCode)

    #group_info_ordered = OrderedDict((group, True if group in rated_groups else False) for group in group_nums)

    #group_info = dict(group_info_ordered.items())

    return jsonify(status=200, data=group_info)
