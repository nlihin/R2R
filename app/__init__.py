from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS,cross_origin

from flask_jwt_extended import JWTManager
import datetime
import os

#app = Flask(__name__)
app = Flask(__name__,static_folder='../frontend/build',static_url_path='')
cors = CORS(app, origins='http://localhost:3000', supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST"])

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL_PROD')
app.config['SECRET_KEY'] = 'asdfla234509sdflsdf235'
app.config["JWT_SECRET_KEY"] = "super-secret"
app.config['DEBUG'] = True
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['JWT_EXPIRATION_DELTA'] = datetime.timedelta(seconds=3600)

db = SQLAlchemy(app)
jwt = JWTManager(app)

from app.routes_auth import auth
from app.routes_group import group
from app.routes_rate import rate
from app.routes_rank import rank

app.register_blueprint(auth)
app.register_blueprint(group)
app.register_blueprint(rate)
app.register_blueprint(rank)

from flask.helpers import send_from_directory

@app.route('/')
@cross_origin()
def serve():
    return send_from_directory(app.static_folder,'index.html')
