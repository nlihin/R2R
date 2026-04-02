from flask import Blueprint

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

from app.admin import routes_admin_auth
from app.admin import routes_sysadmin
from app.admin import routes_classadmin
