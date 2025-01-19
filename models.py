from datetime import datetime
from extensions import db



class User(db.Model):
    """
    User model to represent users in the database.
    """
    __tablename__ = 'Users'
    userId = db.Column(db.Integer, primary_key=True)  # Primary key
    username = db.Column(db.String(50), nullable=False)  # Username
    password = db.Column(db.String(255), nullable=False)  # Hashed password
    email = db.Column(db.String(50), unique=True, nullable=False)  # Unique email
    fname = db.Column(db.String(50), nullable=False)  # First name
    lname = db.Column(db.String(50), nullable=False)  # Last name


PRIORITY_CHOICES = {
    1: "Important and urgent",
    2: "Important but not urgent",
    3: "Not important but urgent",
    4: "Not important and not urgent",
}

class PersonalTask(db.Model):
    __tablename__ = 'PersonalTasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    deadline = db.Column(db.DateTime)
    priority = db.Column(db.Integer, nullable=False)  # Values 1-4 only
    status = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('Users.userId'))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.strftime("%Y-%m-%d %H:%M:%S") if self.due_date else None,
            "deadline": self.deadline.strftime("%Y-%m-%d %H:%M:%S") if self.deadline else None,
            "priority": PRIORITY_CHOICES.get(self.priority, "Unknown"),
            "status": self.status,
            "user_id": self.user_id,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
        }
    
    
class Task(db.Model):
    __tablename__ = 'Tasks'
    taskId = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    assignedTo = db.Column(db.Integer, db.ForeignKey('Users.userId'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Pending')
    dueDate = db.Column(db.Date, nullable=True)
    createdAt = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

group_user_association = db.Table(
    'group_user_association',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('group_id', db.Integer, db.ForeignKey('Groups.id', ondelete='CASCADE')),
    db.Column('user_id', db.Integer, db.ForeignKey('Users.userId', ondelete='CASCADE'))
)

task_user_association = db.Table(
    'task_user_association',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('task_id', db.Integer, db.ForeignKey('GroupTasks.id', ondelete='CASCADE')),
    db.Column('user_id', db.Integer, db.ForeignKey('Users.userId', ondelete='CASCADE'))
)

class Group(db.Model):
    __tablename__ = 'Groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('Users.userId', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    members = db.relationship(
        'User',
        secondary=group_user_association,
        backref=db.backref('groups', lazy='dynamic')
    )

    tasks = db.relationship('GroupTask', backref='group', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_by": self.created_by,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "members": [user.userId for user in self.members],
            "tasks": [task.id for task in self.tasks]
        }

class GroupTask(db.Model):
    __tablename__ = 'GroupTasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    group_id = db.Column(db.Integer, db.ForeignKey('Groups.id', ondelete='CASCADE'), nullable=False)
    due_date = db.Column(db.DateTime)
    priority = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), default="Pending")
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    assigned_users = db.relationship(
        'User',
        secondary=task_user_association,
        backref=db.backref('assigned_tasks', lazy='dynamic')
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "group_id": self.group_id,
            "due_date": self.due_date.strftime("%Y-%m-%d %H:%M:%S") if self.due_date else None,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
            "assigned_users": [user.userId for user in self.assigned_users]
        }
