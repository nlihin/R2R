from flask import Blueprint, request, jsonify
from app.models import Group, Rate, db, Question
from flask_jwt_extended import current_user, jwt_required

group = Blueprint('group', __name__)



group = Blueprint('group', __name__)

#user sends group info , i send back group_name, and q if relevent
@group.route('/group', methods=['GET'])
@jwt_required()
def get_rating_info():

   # group_nums = [group.number for group in Group.query.all()]
    group_nums = [group.number for group in Group.query.filter_by(class_code = current_user.class_code)]
    #rated_groups = [rate.group_number for rate in Rate.query.filter_by(username=current_user.username).all()]
    #Lihi changed to accomadate exp_code
    rated_groups = [rate.group_number for rate in
                    Rate.query.filter_by(username=current_user.username).all()]

    group_nums.sort()
    group_info = {group:(True if group in rated_groups else False) for group in group_nums}

    return jsonify(status = 200,data=group_info)

