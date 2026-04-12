from app import db
from datetime import datetime


class User(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    username = db.Column(db.String(length=30), nullable=False, unique=True)
    name = db.Column(db.String(length=30), nullable=False, unique=False)
    email_address = db.Column(db.String(length=50), nullable=False, unique=False)
    password = db.Column(db.String(length=60), nullable=False)
    class_code = db.Column(db.String(length=1024), nullable=True, unique=False)
    confirm = db.Column(db.Boolean(), nullable=False, default=False)

    def validate_username(self):
        usernames = [user.username for user in User.query.all()]
        if self.username in usernames:
            return False
        return True

    def validate_password(self):
        if self.password != self.username or len(self.username) != 9:
            return False
        return True


class Group(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    number = db.Column(db.Integer(), nullable=False, unique=False)
    name = db.Column(db.String(length=1024), nullable=False, unique=False)
    class_code = db.Column(db.String(length=1024), nullable=False, unique=False)

    __table_args__ = (
        db.UniqueConstraint('number', 'class_code', name='uq_group_number_class'),
    )

class Class_codes(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    class_code = db.Column(db.String(length=1024), nullable=False, unique=True)
    bts_enabled = db.Column(db.Boolean(), nullable=False, default=True)

class Question(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    number = db.Column(db.Integer(), nullable=False, unique=False)
    description = db.Column(db.String(length=1024), nullable=False, unique=False)
    class_code = db.Column(db.String(length=255), nullable=False, default='')

    __table_args__ = (
        db.UniqueConstraint('number', 'class_code', name='uq_question_number_class'),
    )


class QuestionAnswer(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    participant_id = db.Column(
        db.Integer(),
        db.ForeignKey("participants.participant_id"),
        nullable=True,
    )
    question_number = db.Column(db.Integer(), nullable=False, unique=False)
    answer = db.Column(db.Integer(), nullable=False, unique=False)
    group_number = db.Column(db.Integer(), nullable=True, primary_key=False)


class CrowdRating(db.Model):
    __tablename__ = "crowd_rating"

    participant_id = db.Column(
        db.Integer(),
        db.ForeignKey("participants.participant_id"),
        nullable=False,
        primary_key=True,
    )
    group_number = db.Column(db.Integer(), nullable=False, primary_key=True)
    outstanding = db.Column(db.Integer(), nullable=False, primary_key=False)
    very_good = db.Column(db.Integer(), nullable=False, primary_key=False)
    good = db.Column(db.Integer(), nullable=False, primary_key=False)
    fair = db.Column(db.Integer(), nullable=False, primary_key=False)
    needs_improvement = db.Column(db.Integer(), nullable=False, primary_key=False)


class Participant(db.Model):

    __tablename__ = "participants"

    participant_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), nullable=False, index=True)
    class_code = db.Column(db.String(50), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    items = db.relationship(
        "RankNewItem",
        backref="participant",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    __table_args__ = (
        db.UniqueConstraint(
            "username",
            "class_code",
            name="uq_participants_username_class_code",
        ),
    )


class RankNewItem(db.Model):

    __tablename__ = "rank_new_items"

    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(
        db.Integer,
        db.ForeignKey("participants.participant_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    group_id = db.Column(db.Integer, nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)
    class_code = db.Column(db.String(50), nullable=False, index=True)
    position = db.Column(db.Integer, default=1)
    feedback = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        db.UniqueConstraint(
            "participant_id",
            "group_id",
            name="uq_rank_item_participant_group",
        ),
    )


class Pairwise(db.Model):

    __tablename__ = "pairwise"

    id = db.Column(db.Integer(), primary_key=True)
    class_code = db.Column(db.String(length=50), nullable=False)
    participant_id = db.Column(
        db.Integer(),
        db.ForeignKey("participants.participant_id"),
        nullable=False,
    )
    pairwise_q = db.Column(db.String(length=50), nullable=False)
    answer = db.Column(db.Integer(), nullable=False)
    ask_time = db.Column(db.DateTime(), nullable=False)
    answer_time = db.Column(db.DateTime(), nullable=False)