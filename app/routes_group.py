from flask import Blueprint, request, jsonify
from app.models import Group, Rate, db, Question
from flask_jwt_extended import current_user, jwt_required

group = Blueprint('group', __name__)


#user sends group info , i send back group_name, and q if relevent
@group.route('/group', methods=['GET'])
@jwt_required()
def get_rating_info():

    group_nums = [group.number for group in Group.query.filter_by(class_code = current_user.class_code)]
    rated_groups = [rate.group_number for rate in Rate.query.filter_by(username=current_user.username).all()]

    group_nums.sort()
    group_info = {group:(True if group in rated_groups else False) for group in group_nums}

    return jsonify(status = 200,data=group_info)


@group.route('/groups/<int:group_number>')
@jwt_required()
def get_group(group_number):
    print(request.url)
    print(request.args.get('group_number'))
    group_name = db.session.query(Group).filter_by(number=group_number).one_or_none()
    # if group valid
    if group_name:
        questions = {q.number: q.description for q in Question.query.all()}

        return jsonify(status=200, data={"group_name": group_name.name, "questions": questions})

    # check response number
    return jsonify(status=400, msg="Group not registered")