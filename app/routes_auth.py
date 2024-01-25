from flask import Blueprint, request, jsonify
from app.models import User, Class_codes
from app import db, jwt
from flask_jwt_extended import create_access_token
from flask_cors import CORS, cross_origin
from flask import make_response


auth = Blueprint('auth', __name__)


@auth.route('/register', methods=['POST'])
@cross_origin()
#insert user to db
def register():
    new_user = User(username=request.json.get('username'),
                    name=request.json.get('name'),
                    email_address=request.json.get('email_address'),
                    password=request.json.get('password'))
    if new_user.validate_username() and new_user.validate_password():
        db.session.add(new_user)
        db.session.commit()
        return jsonify(status=200)

    return jsonify(status=400, msg='Please check that username == password '), 400


@auth.route('/login', methods=['OPTIONS'])
def handle_options():
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    # response.headers.add('Access-Control-Allow-Methods', 'POST')
    return response

@cross_origin()
@auth.route("/login", methods=["POST"])
def login():
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    class_code_value = request.json.get("class_code", None)

    current_user = db.session.query(User).filter_by(username=username).one_or_none()
    current_class_code = db.session.query(Class_codes).filter_by(class_code=class_code_value).one_or_none()

    if current_user:
        if password == current_user.password:
            if current_class_code:
                current_user.class_code = class_code_value
                # Commit the changes to the database
                db.session.commit()
                access_token = create_access_token(identity=username)
                return jsonify(access_token=access_token, status=200)
            else:
                return jsonify(msg="Invalid class code, ask your course instructor for the correct code", status=400), 400
        else:
            return jsonify(msg="Your password should match your username", status=400), 400
    else:
        return jsonify(msg="Invalid username, did you register?", status=400), 400



# Register a callback function that takes whatever object is passed in as the
# identity when creating JWTs and converts it to a JSON serializable format.
@jwt.user_identity_loader
def user_identity_lookup(user):
    return user


# change username to user id ????

# Register a callback function that loads a user from your database whenever
# a protected route is accessed. This should return any python object on a
# successful lookup, or None if the lookup failed for any reason (for example
# if the user has been deleted from the database).
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(username=identity).one_or_none()


