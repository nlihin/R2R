from app import db
from datetime import datetime


class AdminUser(db.Model):
    __tablename__ = "admin_users"

    admin_id = db.Column(db.CHAR(9), primary_key=True)
    password_hash = db.Column(db.String(255), nullable=False)
    admin_username = db.Column(db.Text, nullable=False)
    admin_email = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False, default='courseadmin')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    must_change_password = db.Column(db.Boolean, nullable=False, default=True)
    
    classes = db.relationship('AdminClass', backref='admin', cascade='all, delete-orphan')


class AdminClass(db.Model):
    __tablename__ = "admin_classes"

    admin_id = db.Column(db.CHAR(9), db.ForeignKey('admin_users.admin_id', ondelete='CASCADE'), primary_key=True)
    class_code = db.Column(db.String(1024), db.ForeignKey('class_codes.class_code', ondelete='CASCADE'), primary_key=True)