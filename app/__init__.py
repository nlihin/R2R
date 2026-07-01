from flask import Flask, request, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from flask_jwt_extended import JWTManager
import datetime
import os
from dotenv import load_dotenv

from flask.helpers import send_from_directory

load_dotenv()

#added 8.4.25
#added the or in the next line 23.1.2026
APP_ENV = os.getenv("APP_ENV", "local")
uri = os.environ.get("DATABASE_URL")
if APP_ENV == "local" and not uri:
    uri = "postgresql://postgres:postgres@localhost:5432/r2r_dev"
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')

origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": origins}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

app.config['SQLALCHEMY_DATABASE_URI'] = uri

_secret_key = os.environ.get("SECRET_KEY")
if not _secret_key:
    raise RuntimeError(
        "SECRET_KEY environment variable must be set. "
        "Copy .env.example to .env for local development."
    )
app.config["SECRET_KEY"] = _secret_key

_jwt_secret_key = os.environ.get("JWT_SECRET_KEY")
if not _jwt_secret_key:
    raise RuntimeError(
        "JWT_SECRET_KEY environment variable must be set. "
        "Copy .env.example to .env for local development."
    )
app.config["JWT_SECRET_KEY"] = _jwt_secret_key
app.config['DEBUG'] = True
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(seconds=18000)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(seconds=3600)

db = SQLAlchemy(app)
jwt = JWTManager(app)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response("", 204)
        origin = request.headers.get("Origin")
        if origin in origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

from app.routes_auth import auth
from app.routes_group import group
from app.routes_rate import rate
from app.routes_rank import rank

app.register_blueprint(auth)
app.register_blueprint(group)
app.register_blueprint(rate)
app.register_blueprint(rank)

from app.admin import admin_bp
app.register_blueprint(admin_bp)

#@app.route('/')
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
@cross_origin(origins=origins)
def serve(path=None):
    if path is None or not path.startswith('static/'):
        # If the path is None or doesn't start with 'static/', serve index.html
        return send_from_directory(app.static_folder, 'index.html')
    else:
        # Otherwise, serve the requested file from the static folder
        return send_from_directory(app.static_folder, path)


@app.errorhandler(404)
#def not_found(): #changed 23.1.2026
def not_found(error):
    return send_from_directory(app.static_folder, 'index.html')
