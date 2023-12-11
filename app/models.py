from app import db


class User(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    username = db.Column(db.String(length=30), nullable=False, unique=True)
    name = db.Column(db.String(length=30), nullable=False, unique=False)
    email_address = db.Column(db.String(length=50), nullable=False, unique=False)
    password = db.Column(db.String(length=60), nullable=False)

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
    number = db.Column(db.Integer(), nullable=False, unique=True)
    name = db.Column(db.String(length=1024), nullable=False, unique=True)


class Question(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    number = db.Column(db.Integer(), nullable=False, unique=True)
    description = db.Column(db.String(length=1024), nullable=False, unique=True)


class QuestionAnswer(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), primary_key=False)
    question_number = db.Column(db.Integer(), nullable=False, unique=False)
    answer = db.Column(db.Integer(), nullable=False, unique=False)


class Rate(db.Model):
    username = db.Column(db.String(), nullable=False, primary_key=True)
    group_number = db.Column(db.Integer(), nullable=False, primary_key=True)
    datetime = db.Column(db.DateTime(), nullable=True)
    rate = db.Column(db.Integer(), nullable=False)


class CrowdRating(db.Model):
    username = db.Column(db.String(), nullable=False, primary_key=True)
    group_number = db.Column(db.Integer(), nullable=False, primary_key=True)
    outstanding = db.Column(db.Integer(), nullable=False, primary_key=False)
    very_good = db.Column(db.Integer(), nullable=False, primary_key=False)
    good = db.Column(db.Integer(), nullable=False, primary_key=False)
    fair = db.Column(db.Integer(), nullable=False, primary_key=False)
    needs_improvement = db.Column(db.Integer(), nullable=False, primary_key=False)


class Rank(db.Model):
    username = db.Column(db.String(), nullable=False, primary_key=True)
    date = db.Column(db.Date(), nullable=False, primary_key=True)
    list_rank = db.Column(db.String(length=1024), nullable=True)
    number_questions = db.Column(db.Integer(), nullable=False, default=0)
    experiment_group = db.Column(db.Integer(), nullable=False, default=1)
