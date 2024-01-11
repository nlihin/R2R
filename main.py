from app import app, db
from app.models import User,Group,Question

if __name__ == '__main__':
    app.app_context().push()
    # db.drop_all()
    # db.create_all()
    #
    #
    # user = User(username = '313388241',
    #                     name = 'mat',
    #                     email_address = 'matanlange@gmail.com',
    #                     password = '313388241')
    # db.session.add(user)
    #
    # db.session.add(Group(number=1,name='test1'))
    # db.session.add(Group(number=2, name='test2'))
    # db.session.add(Group(number=3, name='test3'))
    # db.session.add(Group(number=4, name='test4'))
    #
    # db.session.add(Question(number=1, description='some Question test 1'))
    # db.session.add(Question(number=2, description='some Question test 2 '))
    # db.session.add(Question(number=3, description='some Question test 3 '))
    # db.session.add(Question(number=4, description='some Question test 4 '))
    #
    # db.session.commit()
    app.run()



