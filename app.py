from flask import Flask, jsonify, request, session
from flask_cors import CORS  # Importing CORS
from flask_limiter import Limiter
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.security import generate_password_hash
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask import Flask, jsonify, request, session, url_for
import logging
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity



app = Flask(__name__)
app.secret_key = 'a3f10c9d81b7c6d19e6bc92b7f5041f3b54f7bc541d9fa3d8cc6b39eeced5c1a'  # Secret key for session management

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'your-gmail@example.com'
app.config['MAIL_PASSWORD'] = 'your-gmail-password'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
mail = Mail(app)



# Enable CORS for all routes
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:8081"}})
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8081'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mssql+pyodbc://database:task1234!@takmanager.database.windows.net:1433/TaskManager?driver=ODBC+Driver+17+for+SQL+Server'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking
app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)
jwt = JWTManager(app)

def generate_token(email):
    serializer = Serializer(app.config['SECRET_KEY'], salt='password-reset-salt')
    return serializer.dumps(email)

def confirm_token(token, expiration=1800):
    serializer = Serializer(app.config['SECRET_KEY'], salt='password-reset-salt')
    try:
        email = serializer.loads(token, max_age=expiration)
    except:
        return False
    return email
def generate_token(email):
    serializer = Serializer(app.config['SECRET_KEY'], salt='password-reset-salt')
    return serializer.dumps(email)

def confirm_token(token, expiration=1800):
    serializer = Serializer(app.config['SECRET_KEY'], salt='password-reset-salt')
    try:
        email = serializer.loads(token, max_age=expiration)
    except:
        return False
    return email


# ==================================================== Models ======================================================= #




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




# ==================================================== Routes ======================================================= #

@app.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    Receives user details, validates them, and stores them in the database.
    """
    data = request.get_json()  # Get data from the frontend
    print(f"Received data: {data}")  # Log the data received

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    fname = data.get('fname')
    lname = data.get('lname')

    # Validate fields
    if not all([username, email, password, fname, lname]):
        print("Error: Missing fields")  # Log missing fields
        return jsonify({"message": "Missing fields"}), 400
    if len(password) < 6:
        print("Error: Password too short")  # Log password length issue
        return jsonify({"message": "Password too short"}), 400
    if "@" not in email:
        print("Error: Invalid email format")  # Log email format issue
        return jsonify({"message": "Invalid email format"}), 400

    # Check if the email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        print(f"Error: User with email {email} already exists")  # Log existing user issue
        return jsonify({"message": "User with this email already exists"}), 400

    # Create a new user with hashed password
    try:
        hashed_password = generate_password_hash(password)  # Hash the password
        new_user = User(username=username, email=email, password=hashed_password, fname=fname, lname=lname)
        db.session.add(new_user)
        db.session.commit()
        print("User registered successfully")  # Log success
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()  # Rollback changes in case of an error
        print(f"Failed to register user: {str(e)}")  # Log exception details
        return jsonify({"message": f"Failed to register user: {str(e)}"}), 500



@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()  # Get data from the frontend
    email = data.get('email')
    password = data.get('password')

    print(f"Debug: Received email = {email}, password = {password}")  # Debug

    try:
        user = User.query.filter_by(email=email).first()
        print(f"Debug: User found = {user}")  # Debug

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.userId
            print(f"Debug: Login successful for userId = {user.userId}")  # Debug
            return jsonify({
                "message": "Login successful",
                "userId": user.userId,
                "username": user.username,
                "email": user.email
            }), 200
        else:
            print("Debug: Invalid email or password")  # Debug
            return jsonify({"message": "Invalid email or password"}), 401
    except Exception as e:
        print(f"Debug: Error occurred: {e}")  # Debug
        return jsonify({"message": f"Error occurred during login: {str(e)}"}), 500



@app.route('/logout', methods=['POST'])
def logout():
    """
    Log out the current user by clearing the session.
    """
    if 'user_id' in session:
        session.pop('user_id')  # Remove user ID from session
        return jsonify({"message": "Logged out successfully"}), 200
    else:
        return jsonify({"message": "No user is currently logged in"}), 400


@app.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    Retrieve user details by user ID.
    """
    try:
        user = User.query.filter_by(userId=user_id).first()  # Find the user by ID
        if user:
            return jsonify({
                "userId": user.userId,
                "username": user.username,
                "email": user.email,
                "fname": user.fname,
                "lname": user.lname
            
            }), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"message": f"Error occurred while fetching user: {str(e)}"}), 500
    

@app.route('/update_user', methods=['PUT'])
def update_user():
    """
    Update user details (first name, last name, email, password).
    """
    data = request.get_json()
    user_id = data.get('userId')
    fname = data.get('fname')
    lname = data.get('lname')
    email = data.get('email')
    password = data.get('password')  # Optional password

    if not all([user_id, fname, lname, email]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        user = User.query.filter_by(userId=user_id).first()  # Find the user
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Update user fields
        user.fname = fname
        user.lname = lname
        user.email = email

        # If a new password is provided, hash and update it
        if password:
            user.password = generate_password_hash(password)

        db.session.commit()  # Save changes
        return jsonify({"message": "User info updated successfully"}), 200
    except Exception as e:
        db.session.rollback()  # Rollback changes in case of an error
        return jsonify({"message": f"Failed to update user info: {str(e)}"}), 500



@app.route('/change_password', methods=['POST'])
def change_password():
    """
    Change the user's password after verifying the old password.
    """
    data = request.get_json()
    user_id = session.get('user_id')  # Fixed reference to session.get
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')

    if not all([user_id, old_password, new_password]):
        return jsonify({"message": "Missing fields"}), 400

    try:
        user = User.query.get(user_id)  # Corrected user fetching
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Verify old password
        if not check_password_hash(user.password, old_password):
            return jsonify({"message": "Incorrect old password"}), 401

        # Update to the new hashed password
        user.password = generate_password_hash(new_password)

        db.session.commit()  # Save changes
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()  # Rollback changes in case of an error
        return jsonify({"message": f"Failed to update password: {str(e)}"}), 500






@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    email = confirm_token(token)
    if not email:
        return jsonify({'message': 'The reset link is invalid or has expired'}), 400

    if request.method == 'POST':
        data = request.get_json()  # Use JSON payload
        new_password = data.get('password')  # Expect `password` in JSON

        if not new_password:
            return jsonify({'message': 'Password is required'}), 400

        user = User.query.filter_by(email=email).first()
        if user:
            user.password = generate_password_hash(new_password)
            db.session.commit()
            return jsonify({'message': 'Your password has been updated successfully'}), 200
        else:
            return jsonify({'message': 'User not found'}), 404

    # Optional: Keep the GET method to serve an HTML form for testing
    return '''
    <form method="post">
        <input type="password" name="password"/>
        <input type="submit" value="Reset Password"/>
    </form>
    '''

@app.route('/request_reset', methods=['POST'])
def request_reset():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Email not found'}), 404

    # Generate password reset token
    token = generate_token(user.email)

    # Send email with password reset link
    msg = Message("Reset Your Password",
                  sender=app.config['MAIL_USERNAME'],
                  recipients=[user.email])
    reset_link = url_for('reset_password', token=token, _external=True)
    msg.body = f"Click the link to reset your password: {reset_link}"
    try:
        mail.send(msg)
        return jsonify({'message': 'Password reset link sent to your email'}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to send email: {str(e)}'}), 500



@app.route('/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400
    
    new_task = PersonalTask(
        title=data['title'],
        description=data.get('description'),
        due_date=data.get('due_date'),
        deadline=data.get('deadline'),
        priority=data.get('priority'),
        status=data.get('status'),
        user_id=data.get('user_id')
    )
    
    db.session.add(new_task)
    try:
        db.session.commit()
        return jsonify(new_task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Unable to create task', 'error': str(e)}), 500



@app.route('/tasks/user/<int:user_id>', methods=['GET'])
def get_user_tasks(user_id):
    try:
        print(f"Fetching tasks for user ID: {user_id}")  # Debugging log
        tasks = PersonalTask.query.filter_by(user_id=user_id).all()
        if not tasks:
            return jsonify({"message": "No tasks found for this user."}), 404
        task_list = [task.to_dict() for task in tasks]
        return jsonify(task_list), 200
    except Exception as e:
        print(f"Error fetching tasks for user {user_id}: {e}")  # Debugging log
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500


@app.route('/tasks/dates', methods=['GET'])
def get_tasks_by_date_range():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({"message": "Start and end dates are required"}), 400

    try:
        tasks = PersonalTask.query.filter(PersonalTask.due_date.between(start_date, end_date)).all()
        task_list = [task.to_dict() for task in tasks]
        return jsonify(task_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================================================== Main ========================================================== #

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)



