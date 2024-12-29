from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'Users'
    userId = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    fname = db.Column(db.String(50), nullable=False)
    lname = db.Column(db.String(50), nullable=False)

    tasks = db.relationship('Task', backref='user', lazy=True)

    def __repr__(self):
        return f"<User(userId={self.userId}, username={self.username}, email={self.email})>"

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

    def __repr__(self):
        return f"<Task(taskId={self.taskId}, title={self.title}, status={self.status})>"
