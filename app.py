import os
from flask import Flask, app, jsonify, request, session, make_response, url_for
from flask_cors import CORS  # Importing CORS
from flask_sqlalchemy import SQLAlchemy
import pyodbc
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer as Serializer
import logging
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from abc import ABC, abstractmethod
from dotenv import load_dotenv
from models import db,User,PersonalTask, Group, GroupTask, group_user_association, task_user_association
from extensions import db, mail, jwt

# Load environment variables
load_dotenv()

def create_app():
    # Application setup
    app = Flask(__name__)
    app.secret_key = os.getenv('FLASK_APP_SECRET_KEY')

    # Mail configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False

    # Database ORM configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = True

    # JWT Authentication setup
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)

    # CORS setup
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:8081"}})

    


    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8081'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    register_routes(app)

    return app

# ==================================================== SQLHelper-Class ======================================================= #

class SQLHelper(ABC):
    connection = None  # connecction string for SQL server database
    cursor = None  # cursor for executig SQL commands

    # method for connecting to SQL server database
    def connect(self):
        # load environment variables from env file
        load_dotenv()
        # getting necessary database credentials from env file for database connection
        connectionString = os.getenv('DB_CONNECTION_STRING')
        self.connection = pyodbc.connect(connectionString)
        self.cursor = self.connection.cursor()  # initialize cursor 

    # method for closing database connection
    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
# ==================================================== Models ======================================================= #








# ==================================================== Routes ======================================================= #
def register_routes(app):

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
            user = User.query.filter_by(email=email).first()  # Fetch user by email
            print(f"Debug: User found = {user}")  # Debug

            if user and check_password_hash(user.password, password):  # Validate password
                # Create the JWT token with the user ID as the identity
                token = create_access_token(identity=user.userId)

                print(f"Debug: Login successful for userId = {user.userId}")  # Debug
                return jsonify({
                    "message": "Login successful",
                    "token": token,  # Include the JWT token in the response
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


    @app.route('/tasks/delete/<int:task_id>', methods=['DELETE'])
    def delete_task(task_id):
        task = PersonalTask.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted successfully"}), 200

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



    @app.route('/tasks/dates', methods=['GET'])
    def get_tasks_by_date_range():
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not start_date or not end_date:
            return jsonify({"message": "Missing start_date or end_date parameters"}), 400

        try:
            tasks = PersonalTask.query.filter(PersonalTask.due_date.between(start_date, end_date)).all()
            task_list = [task.to_dict() for task in tasks]
            return jsonify(task_list), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500




    
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


    @app.route('/tasks/<int:task_id>', methods=['PUT'])
    def update_task(task_id):
        task = PersonalTask.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        data = request.get_json()
        try:
            # Update task fields from the request, retaining current values if not specified
            task.title = data.get('title', task.title)
            task.description = data.get('description', task.description)
            task.priority = data.get('priority', task.priority)
            task.status = data.get('status', task.status)
            task.due_date = data.get('due_date', task.due_date)
            task.deadline = data.get('deadline', task.deadline)
            
            db.session.commit()
            return jsonify(task.to_dict()), 200  # Ensure that your task model has a to_dict method to serialize its data

        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500


    @app.route('/groups', methods=['GET'])
    def get_groups():
        try:
            # Optional: Get query parameters for filtering
            group_id = request.args.get('group_id', type=int)
            created_by = request.args.get('created_by', type=int)

            # Query groups based on parameters
            if group_id:
                group = Group.query.get(group_id)
                if not group:
                    return jsonify({"error": "Group not found"}), 404
                return jsonify(group.to_dict()), 200

            if created_by:
                groups = Group.query.filter_by(created_by=created_by).all()
            else:
                groups = Group.query.all()

            # Convert to JSON
            group_list = [group.to_dict() for group in groups]
            return jsonify(group_list), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @app.route('/groups/user/<int:user_id>', methods=['GET'])
    def get_user_groups(user_id):
        try:
            # Groups created by the user
            created_groups = Group.query.filter_by(created_by=user_id).all()

            # Groups the user is a member of
            member_groups = Group.query.join(group_user_association).filter(
                group_user_association.c.user_id == user_id
            ).all()

            # Combine results and remove duplicates
            all_groups = list({group.id: group for group in created_groups + member_groups}.values())

            # Convert to JSON
            group_list = [group.to_dict() for group in all_groups]
            return jsonify(group_list), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @app.route('/groups/<int:group_id>/tasks', methods=['GET'])
    def get_group_tasks(group_id):
        group = Group.query.get(group_id)
        if not group:
            return jsonify({"message": "Group not found."}), 404

        try:
            group_tasks = group.tasks  # Using the relationship
            print(f"Debug: Fetched tasks for group {group_id}: {group_tasks}")  # Debug log

            if not group_tasks:
                return jsonify([]), 200  # Return an empty list if no tasks

            task_list = [task.to_dict() for task in group_tasks]
            return jsonify(task_list), 200
        except Exception as e:
            print(f"Debug: Error occurred while fetching tasks for group {group_id}: {str(e)}")  # Debug log
            return jsonify({"error": str(e)}), 500



    @app.route('/groups/<int:group_id>', methods=['DELETE'])
    def delete_group(group_id):
        # Fetch the group from the database
        group = Group.query.get(group_id)
        if not group:
            return jsonify({"message": "Group not found"}), 404

        # Check if the current user is the creator of the group
        user_id = request.headers.get('User-ID')
        if not user_id or int(user_id) != group.created_by:
            return jsonify({"message": "Unauthorized. Only the group creator can delete the group"}), 403

        try:
            # Delete the group
            db.session.delete(group)
            db.session.commit()
            return jsonify({"message": "Group deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Failed to delete group: {str(e)}"}), 500




    @app.route('/add_group', methods=['POST'])
    def add_group():
        data = request.get_json()
        group_name = data.get('name')
        creator_id = data.get('created_by')

        if not group_name or not creator_id:
            return jsonify({"message": "Missing group name or creator ID"}), 400

        creator = User.query.get(creator_id)
        if not creator:
            return jsonify({"message": "Creator not found"}), 404

        try:
            # Create the group
            new_group = Group(name=group_name, created_by=creator_id)
            db.session.add(new_group)
            db.session.flush()  # Flush to get the new group ID without committing

            # Add the creator as a member of the group
            insert_statement = group_user_association.insert().values(
                group_id=new_group.id,
                user_id=creator_id
            )
            db.session.execute(insert_statement)

            # Commit both operations
            db.session.commit()

            # Return response with group_id explicitly included
            return jsonify({
                "success": True,
                "message": "Group created and creator added as a member.",
                "group_id": new_group.id,  # Explicitly returning group_id
                "group": new_group.to_dict()
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Failed to add group: {str(e)}"}), 500

        

    @app.route('/users/search', methods=['GET'])
    @jwt_required(optional=True)  # Optional: Require JWT for authentication; remove if public
    def search_user_by_email_or_username():
        search_term = request.args.get('searchTerm')  # Retrieve the searchTerm parameter from the URL query string
        
        if not search_term:
            return jsonify({"message": "Search term (email or username) is required"}), 400

        try:
            # Searching for users by email or username using case-insensitive matching
            users = User.query.filter(
                (User.email.ilike(f'%{search_term}%')) |  # Case-insensitive search for email
                (User.username.ilike(f'%{search_term}%'))  # Case-insensitive search for username
            ).all()  # Changed to `.all()` to return all matches
            
            if users:
                user_list = [
                    {"userId": user.userId, "username": user.username, "email": user.email, "fname": user.fname, "lname": user.lname}
                    for user in users
                ]
                return jsonify(user_list), 200
            else:
                return jsonify({"message": "No user found with that email or username"}), 404
        except Exception as e:
            return jsonify({"message": str(e)}), 500




    @app.route('/groups/<int:group_id>/add_user', methods=['POST'])
    @jwt_required()  # Ensure JWT is required
    def add_user_to_group(group_id):
        user_id = get_jwt_identity()  # Get the user ID from the JWT token

        # Log the incoming request data for debugging purposes
        data = request.get_json()
        requested_user_id = data.get('user_id')  # Get the user_id from the request body
        print(f"Debug: Received user_id: {requested_user_id}, group_id: {group_id}")  # <-- Add this line to log the received user_id and group_id

        # Ensure user_id is present in the body and is a valid integer
        if not requested_user_id or not isinstance(requested_user_id, int):
            return jsonify({"message": "Invalid user_id provided."}), 400

        # Fetch the group and user from the database
        group = Group.query.get(group_id)
        if not group:
            return jsonify({"message": "Group not found"}), 404

        user = User.query.get(requested_user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Check if the user is already a member of the group
        if user in group.members:
            return jsonify({"message": "User is already a member of the group"}), 409

        # Add user to the group
        group.members.append(user)
        db.session.commit()

        return jsonify({"message": "User added to the group successfully!"}), 200






    @app.route('/group-tasks', methods=['POST'])
    def create_group_task():
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        group_id = data.get('group_id')
        due_date = data.get('due_date')
        priority = data.get('priority')
        status = data.get('status')

        # Check if required fields are provided
        if not title or not description or not group_id or not due_date or not priority or not status:
            return jsonify({"message": "Missing required fields"}), 400

        new_task = GroupTask(
            title=title,
            description=description,
            group_id=group_id,
            due_date=due_date,
            priority=priority,
            status=status
        )

        try:
            db.session.add(new_task)
            db.session.commit()
            return jsonify({"message": "Group task created successfully", "task": new_task.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": "Failed to create task", "error": str(e)}), 500


# ==================================================== Main ========================================================== #
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

if __name__ == '__main__':
    app = create_app()  # Use the app from the create_app function
    try:

        with app.app_context():
            db.create_all()  
            logging.info("Database tables created successfully.")

        logging.info("Starting the web server...")
        app.run(host=os.getenv('HOST_IP', '0.0.0.0'), port=5000)
    except Exception as e:
        logging.error(f"Failed to start the application: {e}")

 

