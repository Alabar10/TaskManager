from datetime import datetime
from extensions import db
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.mssql import NVARCHAR


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
    due_date = db.Column(db.DateTime, default=db.func.current_timestamp())  
    deadline = db.Column(db.DateTime)
    priority = db.Column(db.Integer, nullable=False)  # Values 1-4 only
    status = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('Users.userId'))
    category = db.Column(db.String(100), nullable=False, default="General")  # New column
    actual_time = db.Column(db.DateTime, nullable=True)  
    start_time = db.Column(db.DateTime, nullable=True)  
    estimated_time = db.Column(db.Float, nullable=True) 
    time_taken = db.Column(db.String(50), nullable=True)  # ✅ Store formatted time taken
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
            time_taken = None
            formatted_time = None

            if self.actual_time and self.start_time:
                time_taken = (self.actual_time - self.start_time).total_seconds() / 3600  # Get time in hours
                
                # Convert to "X hours, Y minutes" format
                hours = int(time_taken)
                minutes = int((time_taken - hours) * 60)
                formatted_time = f"{hours} hours, {minutes} minutes"
                
            return {
                "id": self.id,
                "title": self.title,
                "description": self.description,
                "due_date": self.due_date.strftime("%Y-%m-%d %H:%M:%S") if self.due_date else None,
                "deadline": self.deadline.strftime("%Y-%m-%d %H:%M:%S") if self.deadline else None,
                "priority": PRIORITY_CHOICES.get(self.priority, "Unknown"),
                "status": self.status,
                "user_id": self.user_id,
                "category": self.category, 
                "actual_time": self.actual_time.strftime("%Y-%m-%d %H:%M:%S") if self.actual_time else None,
                "start_time": self.start_time.strftime("%Y-%m-%d %H:%M:%S") if self.start_time else None,
                "estimated_time": round(self.estimated_time, 2) if self.estimated_time is not None else None,  
                "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
                "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
                "time_taken": formatted_time if formatted_time else None  
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
    due_date = db.Column(db.DateTime, default=datetime.utcnow)  
    deadline = db.Column(db.DateTime, nullable=True)  
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
            "deadline": self.deadline.strftime("%Y-%m-%d %H:%M:%S") if isinstance(self.deadline, datetime) else None, 
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
            "assigned_users": [user.userId for user in self.assigned_users]
        }







class UserFreeSchedule(db.Model):
    __tablename__ = 'UserFreeSchedule'
    __table_args__ = {'schema': 'dbo'}  # Ensure SQLAlchemy targets the dbo schema

    schedule_id = db.Column("ScheduleID", db.Integer, primary_key=True)
    user_id = db.Column("UserID", db.Integer, db.ForeignKey('Users.userId'), nullable=False)
    sunday = db.Column("Sunday", db.String(255), nullable=True)
    monday = db.Column("Monday", db.String(255), nullable=True)
    tuesday = db.Column("Tuesday", db.String(255), nullable=True)
    wednesday = db.Column("Wednesday", db.String(255), nullable=True)
    thursday = db.Column("Thursday", db.String(255), nullable=True)
    friday = db.Column("Friday", db.String(255), nullable=True)
    saturday = db.Column("Saturday", db.String(255), nullable=True)
    created_at = db.Column("CreatedAt", db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column("UpdatedAt", db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "userID": self.user_id,  # Use self.user_id
            "sunday": self.sunday.split(",") if self.sunday else [],
            "monday": self.monday.split(",") if self.monday else [],
            "tuesday": self.tuesday.split(",") if self.tuesday else [],
            "wednesday": self.wednesday.split(",") if self.wednesday else [],
            "thursday": self.thursday.split(",") if self.thursday else [],
            "friday": self.friday.split(",") if self.friday else [],
            "saturday": self.saturday.split(",") if self.saturday else [],
            "createdAt": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updatedAt": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        }


class UserSchedule(db.Model):
    __tablename__ = 'UserSchedule'
    __table_args__ = {'schema': 'dbo'}  # ensure it's created in the right schema

    schedule_id = db.Column("ScheduleID", db.Integer, primary_key=True)
    user_id = db.Column("UserID", db.Integer, db.ForeignKey('Users.userId'), nullable=False, unique=True)
    schedule_json = db.Column("ScheduleJSON", NVARCHAR(None), nullable=False)  # store as full JSON string
    created_at = db.Column("CreatedAt", db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column("UpdatedAt", db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "schedule": self.schedule_json,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
        }