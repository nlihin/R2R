from flask import Blueprint
from flask_cors import CORS
import os

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

CORS(
    admin_bp,
    origins=origins,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

from app.admin import routes_admin_auth
from app.admin import routes_sysadmin
from app.admin import routes_classadmin