from json import encoder
import os
from flask import Flask, jsonify, request, session, make_response, url_for,render_template_string,send_from_directory
from flask_cors import CORS, cross_origin  
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
import logging
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime,timedelta
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from models import Task, db, User, PersonalTask, Group, GroupTask, group_user_association, task_user_association,UserFreeSchedule,UserSchedule,GroupMessage
from extensions import db, mail, jwt
import logging
import numpy as np
import tensorflow as tf  
import joblib  
import pandas as pd
import json
from sqlalchemy.orm import joinedload
from AI.AiChat import generate_ai_advice
from itsdangerous import URLSafeTimedSerializer
from urllib.parse import quote
from collections import defaultdict
from werkzeug.utils import secure_filename


# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=".env", override=True)
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


    print("✅ Loaded MAIL_USERNAME:", os.getenv("MAIL_USERNAME"))
    print("✅ Loaded MAIL_PASSWORD:", os.getenv("MAIL_PASSWORD"))

    # Database ORM configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')

    if not app.config['SQLALCHEMY_DATABASE_URI']:
        raise RuntimeError("❌ DATABASE URI NOT FOUND! Check your .env file.")
    

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = False

    # JWT Authentication setup
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)

    # CORS setup
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:8081", "http://192.168.1.42:8081", "*"]}})
# ============================= 🧠 Load AI Model and Encoders ============================= #

    print("📌 Checking AI Model and Encoders Before Loading...")

    # ✅ Define Paths
    model_path = "AI/task_prediction_model.keras"  
    category_encoder_path = "AI/category_encoder.pkl"
    feature_scaler_path = "AI/feature_scaler.pkl"
    time_scaler_path = "AI/time_scaler.pkl"

    # ✅ Debug: Check if files exist
    missing_files = [file for file in [model_path, category_encoder_path, feature_scaler_path, time_scaler_path] if not os.path.exists(file)]

    if missing_files:
        print(f"❌ Missing AI files: {missing_files}")
        raise FileNotFoundError(f"Required AI files missing: {missing_files}")

    try:
        # ✅ Load Model
        print("🔄 Loading AI model...")
        model = tf.keras.models.load_model(model_path)
        print("✅ Model loaded successfully!")

        # ✅ Load Category Encoder
        print("🔄 Loading category encoder...")
        category_encoder = joblib.load(category_encoder_path)
        print(f"✅ Category Encoder Loaded!")

        # ✅ Load Feature Scaler
        print("🔄 Loading feature scaler...")
        feature_scaler = joblib.load(feature_scaler_path)
        print(f"✅ Feature Scaler Loaded! Expected Features: {feature_scaler.n_features_in_}")

        # ✅ Load Time Scaler
        print("🔄 Loading time scaler...")
        time_scaler = joblib.load(time_scaler_path)
        print(f"✅ Time Scaler Loaded!")

        # ✅ Store AI components in Flask app config
        app.config["MODEL"] = model
        app.config["CATEGORY_ENCODER"] = category_encoder
        app.config["FEATURE_SCALER"] = feature_scaler
        app.config["TIME_SCALER"] = time_scaler

        print("✅ AI Model and Encoders Loaded Successfully!")

    except Exception as e:
        print(f"❌ Error loading AI Model or Encoders: {e}")
        app.config["MODEL"] = None
        app.config["CATEGORY_ENCODER"] = None
        app.config["FEATURE_SCALER"] = None
        app.config["TIME_SCALER"] = None



    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')  # Dynamic origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

        
    routes(app)

    return app


# ==================================================== Routes ======================================================= #
def routes(app):

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

    @app.route("/tasks/<int:task_id>", methods=["DELETE"])
    def delete_task(task_id):
        print(f"Received DELETE request for task ID: {task_id}")  # Debugging log

        task = PersonalTask.query.get(task_id)  # ✅ Use the correct table

        if not task:
            print(f"Task ID {task_id} not found!")  # Debugging log
            return jsonify({"error": "Task not found"}), 404

        try:
            db.session.delete(task)
            db.session.commit()
            print(f"Task {task_id} deleted successfully!")  # Debugging log
            return jsonify({"message": "Task deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to delete task: {str(e)}"}), 500


    @app.route('/group-tasks/delete/<int:task_id>', methods=['DELETE'])
    def delete_group_task(task_id):
        task = GroupTask.query.get(task_id)
        
        if not task:
            return jsonify({"error": "Group Task not found"}), 404

        try:
            # Remove any user associations for the task before deleting it
            db.session.execute(task_user_association.delete().where(task_user_association.c.task_id == task_id))

            db.session.delete(task)
            db.session.commit()
            return jsonify({"message": "Group Task deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to delete group task: {str(e)}"}), 500




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
        try:
            # Fetch all tasks without filtering by date range
            tasks = PersonalTask.query.all()
            task_list = [task.to_dict() for task in tasks]
            return jsonify(task_list), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500



    @app.route('/tasks', methods=['POST'])
    def create_task():
        data = request.get_json()
        
        if not data or not data.get('title'):
            return jsonify({'message': 'Title is required'}), 400
        created_at = datetime.utcnow()
        due_date = data.get('due_date', created_at)

        new_task = PersonalTask(
            title=data['title'],
            description=data.get('description'),
            due_date=due_date,
            deadline=data.get('deadline'),
            priority=data.get('priority'),
            status=data.get('status'),
            category = data.get('category', 'General'),  
            user_id=data.get('user_id'),
            estimated_time=float(data.get('estimated_time', 0))  

        )
        
        db.session.add(new_task)
        try:
            db.session.commit()
            return jsonify(new_task.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Unable to create task', 'error': str(e)}), 500

    @app.route('/tasks/<int:task_id>', methods=['GET'])
    def get_task(task_id):
        """Fetch a personal task by ID."""
        task = PersonalTask.query.get(task_id)  # Ensure PersonalTask is your Task model
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task.to_dict()), 200  # Ensure PersonalTask has a `to_dict()` method




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
            print(f"🔍 Before Update: {task.to_dict()}")  # Debugging before update

            # ✅ Ensure status updates correctly
            if "status" in data:
                new_status = data["status"]
                print(f"🔍 Updating status from {task.status} ➝ {new_status}")

                if new_status == "In Progress" and not task.start_time:
                    # ✅ Set start_time ONLY when first moved to "In Progress"
                    task.start_time = datetime.utcnow()
                    print(f"⏳ Start Time Set: {task.start_time}")

                elif new_status == "Done" and task.start_time:
                    # ✅ Set actual_time and calculate time_taken when moving to "Done"
                    task.actual_time = datetime.utcnow()
                    time_diff = task.actual_time - task.start_time
                    hours = time_diff.total_seconds() // 3600
                    minutes = (time_diff.total_seconds() % 3600) // 60
                    task.time_taken = f"{int(hours)} hours, {int(minutes)} minutes"
                    print(f"✅ Time Taken: {task.time_taken}")

                task.status = new_status  # Update status

            # ✅ Update other task fields
            task.title = data.get("title", task.title)
            task.description = data.get("description", task.description)
            task.priority = data.get("priority", task.priority)
            task.due_date = data.get("due_date", task.due_date)
            task.deadline = data.get("deadline", task.deadline)
            task.category = data.get("category", task.category)

            db.session.commit()
            print(f"✅ After Update: {task.to_dict()}")

            return jsonify(task.to_dict()), 200  

        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"🚨 Error updating task: {str(e)}")
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

    @app.route('/groups/<int:group_id>/tasks/<int:task_id>', methods=['GET'])
    def get_single_group_task(group_id, task_id):
        group = Group.query.get(group_id)
        if not group:
            return jsonify({"message": "Group not found."}), 404

        # ✅ Find the specific task within the group
        task = next((task for task in group.tasks if task.id == task_id), None)

        if not task:
            return jsonify({"message": "Task not found in this group."}), 404

        return jsonify(task.to_dict()), 200




    @app.route('/groups/<int:group_id>', methods=['DELETE'])
    def delete_group(group_id):
        group = Group.query.get(group_id)
        if not group:
            return jsonify({"message": "Group not found"}), 404

        user_id = request.headers.get('User-ID')
        if not user_id or int(user_id) != group.created_by:
            return jsonify({"message": "Unauthorized. Only the group creator can delete the group"}), 403

        try:
            # Delete all associated group tasks first
            GroupTask.query.filter_by(group_id=group_id).delete()

            # Delete group-user associations
            db.session.execute(group_user_association.delete().where(group_user_association.c.group_id == group_id))

            # Delete the group itself
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


    @app.route('/group-tasks', methods=['POST'])
    def create_group_task():
        data = request.get_json()

        required_fields = ["title", "description", "group_id", "priority", "status","category"]
        missing_fields = [field for field in required_fields if field not in data or data[field] is None or data[field] == '']

        if missing_fields:
            app.logger.warning("❌ Missing fields: %s", missing_fields)
            return jsonify({"message": "Missing required fields", "missing": missing_fields}), 400

        title = data.get('title')
        description = data.get('description')
        group_id = data.get('group_id')
        priority = data.get('priority')
        status = data.get('status')
        category=data.get('category')
        created_at = datetime.utcnow()

        due_date = data.get('due_date', created_at)
        if due_date and isinstance(due_date, str):
            try:
                due_date = datetime.strptime(due_date, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                return jsonify({"message": "Invalid date format. Expected ISO 8601 (YYYY-MM-DDTHH:MM:SS)"}), 400

        print(f"📩 Creating new group task with data: {data}")  # Log the incoming data
        new_task = GroupTask(

            title=title,
            description=description,
            group_id=group_id,
            due_date=due_date,
            priority=priority,
            status=status,
            category=category
        )

        try:
            db.session.add(new_task)
            db.session.commit()
            print(f"✅ Group task created successfully: {new_task.to_dict()}")  # Log success
            return jsonify({"message": "Group task created successfully", "task": new_task.to_dict()}), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"message": "Failed to create task", "error": str(e)}), 500



    @app.route('/groups/<int:group_id>/tasks/<int:task_id>', methods=['PUT'])
    def update_group_task(group_id, task_id):
        print(f"🔍 Looking for group ID: {group_id}")
        group = db.session.get(Group, group_id)

        if not group:
            print("❌ Group not found!")
            return jsonify({"message": "Group not found."}), 404

        print(f"🔍 Looking for task ID: {task_id} in group {group_id}")
        task = GroupTask.query.filter_by(id=task_id, group_id=group_id).first()

        if not task:
            print("❌ Task not found in group!")
            return jsonify({"message": "Task not found in this group."}), 404

        data = request.get_json()
        print(f"📩 Received Data: {data}")

        # ✅ Update basic task fields
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        task.priority = data.get('priority', task.priority)
        task.status = data.get('status', task.status)
        task.due_date = data.get('due_date', task.due_date)
        task.deadline = data.get('deadline', task.deadline)

        # ✅ Update assigned users if provided
        if 'assigned_users' in data:
            user_ids = data['assigned_users']
            task.assigned_users = User.query.filter(User.userId.in_(user_ids)).all()
            print(f"👥 Assigned Users Updated: {user_ids}")

        try:
            db.session.commit()
            print(f"✅ After Update: {task.to_dict()}")
            return jsonify(task.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            print(f"🚨 Database Commit Error: {str(e)}")
            return jsonify({"error": str(e)}), 500



    @app.route('/search_users', methods=['GET'])
    def search_users():
        query = request.args.get('query', '').strip()
        if not query:
            return jsonify([]), 200

        users = User.query.filter(
            db.or_(User.username.ilike(f"%{query}%"), User.email.ilike(f"%{query}%"))
        ).all()

        return jsonify([{
            "userId": user.userId,
            "username": user.username,
            "email": user.email,
            "fname": user.fname,
            "lname": user.lname
        } for user in users]), 200


    @app.route('/add_user_to_group', methods=['POST'])
    def add_user_to_group():
        data = request.get_json(force=True)  # Using force=True to ensure JSON format is enforced
        group_id = data.get('group_id')
        user_id = data.get('user_id')

        # Validate presence of required parameters
        if not group_id or not user_id:
            return jsonify({"error": "Missing required parameters: group_id or user_id"}), 400

        try:
            # Retrieve group and user from the database
            group = Group.query.get(group_id)
            if not group:
                return jsonify({"error": "Group not found"}), 404

            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Check if user is already a member of the group
            if user in group.members:
                return jsonify({"message": "User is already a member of this group"}), 200

            # Add user to the group
            group.members.append(user)
            db.session.commit()

            return jsonify({"message": "User added to group successfully"}), 200

        except SQLAlchemyError as e:
            db.session.rollback()  # Roll back the transaction on error
            return jsonify({"error": "Database error", "message": str(e)}), 500
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Internal server error", "message": str(e)}), 500
        


    @app.route('/tasks/dates', methods=['GET'])
    def get_tasks_by_dates():
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Validate user_id
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        # Validate date format
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            if start > end:
                return jsonify({"error": "Start date must be before end date"}), 400
        except ValueError:
            return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

        try:
            # Fetch tasks from the database
            tasks = PersonalTask.query.filter(
                PersonalTask.user_id == user_id,
                PersonalTask.due_date >= start,
                PersonalTask.due_date <= end
            ).all()

            # Convert tasks to dictionary format using the model's to_dict method
            task_list = [task.to_dict() for task in tasks] if tasks else []
            return jsonify(task_list), 200
        except SQLAlchemyError as e:
            print(f"Database error occurred: {e}")
            return jsonify({"error": "Failed to fetch tasks from the database"}), 500  


    @app.route('/schedule/<int:user_id>', methods=['GET'])
    def get_user_schedule(user_id):
        try:
            user_schedule = UserFreeSchedule.query.filter_by(user_id=user_id).first()

            if not user_schedule:
                print(f"⚠️ No schedule found for user {user_id}. Returning empty schedule.")
                return jsonify({
                    "userID": user_id,
                    "sunday": [],
                    "monday": [],
                    "tuesday": [],
                    "wednesday": [],
                    "thursday": [],
                    "friday": [],
                    "saturday": [],
                    "message": "No schedule found, returning an empty schedule."
                }), 200

            # Check if there is enough time in the schedule
            total_available_hours = sum([
                        sum(int(hour) for hour in day if isinstance(hour, (int, str)) and str(hour).isdigit())
                        for day in user_schedule.to_dict().values() if isinstance(day, list)
                    ])
            if total_available_hours < 5:  # Adjust threshold as needed
                return jsonify({
                    "userID": user_id,
                    **user_schedule.to_dict(),
                    "message": "You do not have enough available time in your schedule. Consider adjusting your availability."
                }), 200

            return jsonify(user_schedule.to_dict()), 200

        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return jsonify({"error": "Internal server error", "message": str(e)}), 500



        
    @app.route('/schedule/<int:user_id>', methods=['PUT'])
    def edit_user_schedule(user_id):
        data = request.get_json(force=True)

        if not data:
            return jsonify({"error": "No data provided"}), 400

        try:
            user_schedule = UserFreeSchedule.query.filter_by(user_id=user_id).first()

            if not user_schedule:
                print(f"⚠️ No schedule found for user {user_id}. Creating a new one.")
                user_schedule = UserFreeSchedule(
                    user_id=user_id,
                    sunday="",
                    monday="",
                    tuesday="",
                    wednesday="",
                    thursday="",
                    friday="",
                    saturday=""
                )
                db.session.add(user_schedule)
                db.session.commit()  # Save new schedule to database

            for day in ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]:
                if day in data:
                    if isinstance(data[day], list):  # Ensure it's a list
                        setattr(user_schedule, day, ",".join(data[day]))  
                    else:
                        return jsonify({"error": f"Invalid format for {day}. Expected a list."}), 400

            user_schedule.updated_at = datetime.utcnow()  
            db.session.commit()

            print(f"✅ Schedule updated successfully for user {user_id}")
            return jsonify({"message": "Schedule updated successfully"}), 200

        except Exception as e:
            db.session.rollback()
            print(f"❌ ERROR: {str(e)}")
            return jsonify({"error": "Internal server error", "message": str(e)}), 500


    @app.route('/groups/<int:group_id>/members', methods=['GET'])
    def get_group_members(group_id):
        """
        Retrieve all members of a specific group.
        """
        try:
            group = Group.query.filter_by(id=group_id).first()
            
            if not group:
                return jsonify({"error": "Group not found"}), 404

            members = group.members  # This comes from the relationship in your Group model

            members_list = [
                {
                    "userId": member.userId,
                    "username": member.username,
                    "email": member.email,
                    "fname": member.fname,
                    "lname": member.lname
                }
                for member in members
            ]

            return jsonify(members_list), 200

        except Exception as e:
            return jsonify({"error": f"Error fetching group members: {str(e)}"}), 500

    @app.route('/groups/<int:group_id>', methods=['GET'])
    def get_group_details(group_id):
        """
        Retrieve group details, including the creator ID.
        """
        try:
            group = Group.query.filter_by(id=group_id).first()
            
            if not group:
                return jsonify({"error": "Group not found"}), 404

            return jsonify({
                "id": group.id,
                "name": group.name,
                "created_by": group.created_by  # This is the creator's userId
            }), 200

        except Exception as e:
            return jsonify({"error": f"Error fetching group details: {str(e)}"}), 500

    
    @app.route("/save-schedule",methods=["POST"])
    def save_schedule():
        print("📥 /save-schedule called")
        try:
            data = request.get_json()
            user_id=data.get("user_id")
            schedule=data.get("schedule")

            if not user_id or not schedule:
                return jsonify({"error": "user_id and schedule are required"}), 400

            # Convert schedule object to JSON string
            schedule_json = json.dumps(schedule)

            existing = UserSchedule.query.filter_by(user_id=user_id).first()
            if existing:
                existing.schedule_json = schedule_json
                existing.updated_at = datetime.utcnow()
            else:
                new_schedule = UserSchedule(
                    user_id=user_id,
                    schedule_json=schedule_json
                )
                db.session.add(new_schedule)

            db.session.commit()
            return jsonify({"message": "Schedule saved successfully."})
        
        except Exception as e:
            print(f"❌ Error saving schedule: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route("/current-schedule/<int:user_id>", methods=["GET"])
    def get_current_schedule(user_id):
        try:
            # Fetch the saved schedule from the DB
            user_schedule = UserSchedule.query.filter_by(user_id=user_id).first()

            if not user_schedule:
                return jsonify({"message": "No saved schedule found."}), 404

            # Parse the JSON string back to Python object
            schedule = json.loads(user_schedule.schedule_json)

            return jsonify(schedule)  # Return the schedule array directly

        except Exception as e:
            print(f"❌ Error retrieving schedule: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/reset_password', methods=['POST'])
    def reset_password():
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('password')

        if not email or not new_password:
            return jsonify({'message': 'Missing email or password'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404

        hashed_password = generate_password_hash(new_password)
        user['password'] = hashed_password
        db.session.commit()  


        return jsonify({'message': 'Password reset successful'}), 200
    


    @app.route('/request_reset', methods=['POST'])
    def request_reset():
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({"message": "Email is required"}), 400

        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Generate secure token
        serializer = URLSafeTimedSerializer(app.secret_key)
        token = serializer.dumps(email, salt='reset-password-salt')
        safe_token = quote(token)  # URL-encode token for safety

        # ✅ Use HTTPS link instead of myapp:// directly
        reset_url = f"http://192.168.1.42:5000/reset?token={safe_token}"

        print(f"📨 Reset URL to send: {reset_url}")

        try:
            print(f"📧 Sending email to {email}...")
            msg = Message(
                "Password Reset Request",
                sender=os.getenv('MAIL_USERNAME'),
                recipients=[email]
            )

            msg.body = f"Click the link to reset your password:\n\n{reset_url}"

            msg.html = f"""
            <p>Click the button below to reset your password:</p>
            <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" bgcolor="#4CAF50" style="border-radius: 5px;">
                <a href="{reset_url}" target="_blank" style="
                    display: inline-block;
                    padding: 12px 24px;
                    font-family: Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                ">
                    Reset Password
                </a>
                </td>
            </tr>
            </table>

            <p style="margin-top: 20px;">
            Or open this link manually:<br>
            <a href="{reset_url}">{reset_url}</a>
            </p>
            """

            mail.send(msg)
            print("✅ Email sent successfully!")
            return jsonify({"message": "Reset link sent"}), 200

        except Exception as e:
            print(f"❌ Email send failed: {e}")
            return jsonify({"message": f"Failed to send email: {str(e)}"}), 500

    @app.route('/reset')
    def redirect_to_mobile_app():
        token = request.args.get('token')
        if not token:
            return "Invalid or missing token", 400

        return render_template_string(f"""
        <!DOCTYPE html>
        <html>
        <head>
        <title>Redirecting...</title>
        <meta http-equiv="refresh" content="0; url=myapp://reset?token={token}" />
        <style>
            body {{
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 100px;
            }}
            a {{
            display: inline-block;
            margin-top: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 5px;
            }}
        </style>
        </head>
        <body>
        <h2>Redirecting to the app...</h2>
        <p>If nothing happens, click the button below:</p>
        <a href="myapp://reset?token={token}">Open in App</a>
        </body>
        </html>
        """)

    @app.route('/reset_password_token', methods=['POST'])
    def reset_password_token():
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')

        if not token or not new_password:
            return jsonify({"message": "Token and password are required"}), 400

        serializer = URLSafeTimedSerializer(app.secret_key)

        try:
            email = serializer.loads(token, salt='reset-password-salt', max_age=3600)  # 1 hour validity
        except Exception as e:
            return jsonify({"message": "Invalid or expired token"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"message": "User not found"}), 404

        user.password = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({"message": "Password has been reset successfully"}), 200


    @app.route('/group-tasks/user/<int:user_id>', methods=['GET'])
    def get_group_tasks_for_user(user_id):
        tasks = GroupTask.query\
            .join(task_user_association)\
            .filter(task_user_association.c.user_id == user_id)\
            .all()

        result = []
        for task in tasks:
            task_dict = task.to_dict()
            group = Group.query.get(task.group_id)
            task_dict["group"] = {"name": group.name if group else "Unknown Group"}
            result.append(task_dict)

        return jsonify(result)

    @app.route('/groups/<int:group_id>/chat',methods=['POST'])
    def group_chat(group_id):
        data = request.get_json()
        user_id=data.get("user_id")
        content=data.get("content")

        if not user_id or not content:
            return jsonify({"message": "User ID and content are required"}), 400
        
        new_message = GroupMessage(
        group_id=group_id,
        user_id=user_id,
        content=content,
        timestamp=datetime.utcnow()
        )

        db.session.add(new_message)
        db.session.commit()
        return jsonify(new_message.to_dict()), 201
    

    @app.route('/groups/<int:group_id>/chat', methods=['GET'])
    def get_group_messages(group_id):
        messages = GroupMessage.query.filter_by(group_id=group_id).order_by(GroupMessage.timestamp.asc()).all()
        return jsonify([{
            "id": m.id,
            "group_id": m.group_id,
            "user_id": m.user_id,
            "username": m.user.username,  # make sure relationship exists
            "content": m.content,
            "timestamp": m.timestamp.isoformat()
        } for m in messages])

    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    @app.route('/groups/<int:group_id>/chat/upload', methods=['POST'])
    def upload_chat_file(group_id):
        user_id = request.form.get('user_id')
        file = request.files.get('file')
        content = request.form.get('content', "") 

        if not user_id or not file:
            return jsonify({"message": "User ID and file are required"}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        file_url = f"/uploads/{filename}"

        new_message = GroupMessage(
            group_id=group_id,
            user_id=user_id,
            content=content,  
            file_url=file_url,
            timestamp=datetime.utcnow()
        )
        print("🔍 user_id:", user_id)
        print("🔍 file:", file)
        print("🔍 request.form:", request.form)
        print("🔍 request.files:", request.files)

        db.session.add(new_message)
        db.session.commit()

        return jsonify(new_message.to_dict()), 201
 

    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)









 # ============================= 📌 AI Prediction API Endpoint ============================= #
    
   


    @app.route("/predict", methods=["POST"])
    def predict_task_time():
        try:
            data = request.get_json()
            print(f"🔍 Incoming data: {data}")

            model = app.config.get("MODEL")
            category_encoder = app.config.get("CATEGORY_ENCODER")
            feature_scaler = app.config.get("FEATURE_SCALER")
            time_scaler = app.config.get("TIME_SCALER")  # NEW: Get the time scaler

            if not all([model, category_encoder, feature_scaler, time_scaler]):
                return jsonify({"error": "Model or encoders are not loaded properly."}), 500

            category = data.get("category")
            priority = data.get("priority")
            estimated_time = data.get("estimated_time")
            start_time = data.get("start_time")
            deadline = data.get("deadline")

            if not all([category, priority, estimated_time, start_time]):
                return jsonify({"error": "Missing required fields: category, priority, estimated_time, start_time"}), 400

            try:
                priority = int(priority)
                estimated_time = float(estimated_time)
                start_time_dt = pd.to_datetime(start_time)
                start_time_hour = int(start_time_dt.hour)
                deadline_dt = pd.to_datetime(deadline) if deadline else None
            except ValueError:
                return jsonify({"error": "Invalid data type for priority, estimated_time, or start_time"}), 400

            available_time = None
            if deadline_dt:
                available_time = (deadline_dt - start_time_dt).total_seconds() / 60  # minutes
                print(f"🕒 Available Time Before Deadline: {available_time:.2f} minutes")

            if category not in category_encoder.classes_:
                print(f"⚠️ Unknown category: {category}. Defaulting to 'General'")
                category = "General"

            category_encoded = int(category_encoder.transform([category])[0])
            input_data = np.array([[category_encoded, priority, estimated_time, start_time_hour]], dtype=np.float32)
            input_df = pd.DataFrame(input_data, columns=["category_encoded", "priority", "estimated_time", "start_time_hour"])

            # Scale the input features
            scaled_input = feature_scaler.transform(input_df)
            predicted_scaled = model.predict(scaled_input)[0][0]
            print(f"🔎 Model raw output (scaled): {predicted_scaled}")

            # ----- NEW: Inverse transform the predicted value -----
            predicted_time = time_scaler.inverse_transform(np.array([[predicted_scaled]]))[0][0]
            # -------------------------------------------------------

            if np.isnan(predicted_time) or np.isinf(predicted_time) or predicted_time <= 1:
                print("❌ Invalid prediction, defaulting to 120 minutes")
                predicted_time = 120

            predicted_time = max(10, min(float(predicted_time), 480))
            print(f"✅ Final Predicted Time (Minutes): {predicted_time}")

            adjusted_due_to_urgency = False
            if priority == 1 and available_time and predicted_time > available_time:
                predicted_time = available_time
                adjusted_due_to_urgency = True

            return jsonify({
                "predicted_time_minutes": round(predicted_time, 2),
                "predicted_time_hours": round(predicted_time / 60, 2),
                "adjusted_due_to_urgency": adjusted_due_to_urgency
            })

        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


    @app.route("/ai/generate-schedule", methods=["POST"])
    def generate_schedule():
        try:
            data = request.get_json()
            user_id = data.get("user_id")
            raw_task_hours = data.get("task_hours", {})

            print(f"🛠 Generating schedule for user {user_id}...")
            print(f"📦 Received Task Hours: {raw_task_hours}")

            if not user_id or not raw_task_hours:
                return jsonify({"error": "User ID and task hours are required"}), 400

            # ✅ Convert and validate task hours
            try:
                task_hours = {
                    int(task_id): int(round(float(hours)))
                    for task_id, hours in raw_task_hours.items()
                    if hours and str(hours).replace('.', '', 1).isdigit()
                }
            except Exception as e:
                print(f"❌ Error processing task hours: {e}")
                return jsonify({"error": "Invalid task hours data"}), 500

            if not task_hours:
                print("⚠️ No valid task hours provided.")
                return jsonify({"message": "No valid task hours found."}), 400

            # ✅ Fetch user availability
            user_schedule = UserFreeSchedule.query.filter_by(user_id=user_id).first()
            if not user_schedule:
                return jsonify({"error": "No free time found"}), 404

            # ✅ Fetch in-progress tasks
            tasks = db.session.query(PersonalTask).filter(
                PersonalTask.user_id == user_id,
                PersonalTask.status == "In Progress"
            ).order_by(PersonalTask.priority.asc(), PersonalTask.due_date.asc()).all()
            group_tasks = db.session.query(GroupTask).join(task_user_association).filter(
                task_user_association.c.user_id == user_id,
                GroupTask.status == "In Progress"
            ).order_by(GroupTask.priority.asc(), GroupTask.deadline.asc()).all()



            if not tasks:
                return jsonify({"message": "No in-progress tasks found."}), 404

            # ✅ Parse available time slots
            def parse_time_slots(time_ranges):
                    slots = []
                    if not time_ranges:
                        return slots
                    for time_range in time_ranges.split(","):
                        try:
                            start_str, end_str = time_range.strip().split("-")
                            start = datetime.strptime(start_str.strip(), "%H:%M")
                            end = datetime.strptime(end_str.strip(), "%H:%M")

                            if (end - start).total_seconds() < 3600:
                                continue

                            current = start
                            while current + timedelta(hours=1) <= end:
                                slots.append(current)
                                current += timedelta(hours=1)

                        except ValueError as ve:
                            print(f"⚠️ Invalid time format: {time_range} -> {ve}")
                    return sorted(slots)


            week_days = {
                "Sunday": parse_time_slots(user_schedule.sunday),
                "Monday": parse_time_slots(user_schedule.monday),
                "Tuesday": parse_time_slots(user_schedule.tuesday),
                "Wednesday": parse_time_slots(user_schedule.wednesday),
                "Thursday": parse_time_slots(user_schedule.thursday),
                "Friday": parse_time_slots(user_schedule.friday),
                "Saturday": parse_time_slots(user_schedule.saturday),
            }

            print(f"📅 Available Free Slots Per Day: {week_days}")

            schedule = []
            unassigned_tasks = []

            # Prepare schedule maps
            week_days = {
                "Sunday": parse_time_slots(user_schedule.sunday),
                "Monday": parse_time_slots(user_schedule.monday),
                "Tuesday": parse_time_slots(user_schedule.tuesday),
                "Wednesday": parse_time_slots(user_schedule.wednesday),
                "Thursday": parse_time_slots(user_schedule.thursday),
                "Friday": parse_time_slots(user_schedule.friday),
                "Saturday": parse_time_slots(user_schedule.saturday),
            }

            daily_map = {day: [] for day in week_days}
            available_slots = {day: slots.copy() for day, slots in week_days.items()}

            # Schedule each task across multiple available slots
            all_tasks = tasks + group_tasks
            for task in all_tasks:
                remaining_hours = task_hours.get(task.id, 0)
                scheduled_chunks = 0

                for day in week_days:
                    slots = available_slots[day]
                    while remaining_hours > 0 and slots:
                        # Pop the earliest slot
                        slot = slots.pop(0)
                        start_time = slot.strftime("%H:%M")

                        # Save to daily schedule
                        is_group_task = hasattr(task, "group_id")
                        group_name = None

                        if is_group_task:
                            group = db.session.query(Group).filter_by(id=task.group_id).first()
                            group_name = group.name if group else "Unknown Group"

                        daily_map[day].append({
                            "task": task.title,
                            "group_name": getattr(task.group, "name", None) if hasattr(task, "group") else None,
                            "priority": task.priority,
                            "time": 1,
                            "start_time": start_time,
                            "group": group_name if is_group_task else None
                        })



                        remaining_hours -= 1
                        scheduled_chunks += 1

                    if remaining_hours == 0:
                        break

                if remaining_hours > 0:
                    unassigned_tasks.append(task.title)

            # Convert daily_map to final response format
            for day, task_list in daily_map.items():
                if task_list:
                    schedule.append({
                        "day": day,
                        "tasks": task_list
                    })

            print(f"✅ Final Schedule: {schedule}")
            if unassigned_tasks:
                print(f"⚠️ Unscheduled Tasks: {unassigned_tasks}")

            return jsonify({
                "schedule": schedule,
                "unassigned_tasks": unassigned_tasks
            })



        except Exception as e:
            print(f"❌ Error generating schedule: {e}")
            return jsonify({"error": str(e)}), 500



    @app.route('/chat', methods=['POST'])
    def chat_with_ai():
        # Step 1: Parse incoming data
        data = request.get_json()
        user_id = data.get("user_id")
        message = data.get("message", "")

        # Step 2: Fetch user schedule
        schedule_entry = UserSchedule.query.filter_by(user_id=user_id).first()
        schedule_json = schedule_entry.schedule_json if schedule_entry else None

        # Step 3: Fetch personal tasks
        personal_tasks = [
            task.to_dict() for task in PersonalTask.query.filter_by(user_id=user_id).all()
        ]

        # Fetch group tasks
        group_tasks = [
            task.to_dict()
            for task in GroupTask.query.options(joinedload(GroupTask.assigned_users)).all()
            if any(user.userId == int(user_id) for user in task.assigned_users)
        ]

        # Filter urgent tasks (due within 2 days)
        urgent_tasks = [
            t for t in personal_tasks + group_tasks
            if t.get('deadline')
            and datetime.strptime(t['deadline'], "%Y-%m-%d %H:%M:%S") <= datetime.utcnow() + timedelta(days=2)
        ]



        # Now pass urgent_tasks as an extra parameter
        reply = generate_ai_advice(message, schedule_json, personal_tasks, group_tasks, urgent_tasks)
        return jsonify({"reply": reply})
    



    @app.route('/groups/<int:group_id>/ai-distribute', methods=['POST'])
    def ai_distribute_tasks(group_id):
        from collections import defaultdict
        import json

        data = request.get_json()
        tasks = data.get('tasks', [])
        members = data.get('members', [])

        if not tasks or not members:
            return jsonify({"error": "Missing tasks or members"}), 400

        # Step 1: Calculate total free time per user
        user_free_time = {}
        for member in members:
            schedule_entry = UserSchedule.query.filter_by(user_id=member["id"]).first()
            if schedule_entry:
                try:
                    schedule = json.loads(schedule_entry.schedule_json)
                    total_minutes = sum(len(slots) * 60 for slots in schedule.values() if isinstance(slots, list))
                except Exception:
                    total_minutes = 0
            else:
                total_minutes = 0
            user_free_time[member["id"]] = total_minutes

        total_free_time = sum(user_free_time.values()) or 1  # Avoid division by zero

        # Step 2: Sort users by free time (most to least)
        sorted_users = sorted(user_free_time.items(), key=lambda x: x[1], reverse=True)
        user_queue = [user_id for user_id, _ in sorted_users]

        distributed_tasks = []
        user_index = 0

        for task_data in tasks:
            task = db.session.get(GroupTask, task_data["id"])
            if not task:
                continue

            # Assign based on urgency
            assigned_users = []

            is_urgent = (
                task.priority == 1 and
                task.deadline and task.deadline <= datetime.utcnow() + timedelta(days=2)
            )

            num_assignees = 2 if is_urgent else 1  # 👥 Assign 2 if urgent, otherwise 1

            for _ in range(num_assignees):
                if user_index >= len(user_queue):
                    user_index = 0  # cycle back if needed

                user_id = user_queue[user_index]
                user = db.session.get(User, user_id)

                if user and user not in task.assigned_users:
                    task.assigned_users.append(user)
                    assigned_users.append(user.userId)

                user_index += 1

            db.session.commit()
            task_dict = task.to_dict()
            task_dict["new_assigned_users"] = assigned_users  # Debug info
            distributed_tasks.append(task_dict)

        return jsonify(distributed_tasks), 200






  


# ==================================================== Main ========================================================== #
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

if __name__ == '__main__':
    app = create_app()  # Use the app from the create_app function
    try:
        with app.app_context():
            db.create_all()  
            logging.info("Database tables created successfully.")

        logging.info("Starting the web server...")
        app.run(host=os.getenv('HOST_IP', '0.0.0.0'), port=5000,debug=True)
    except Exception as e:
        logging.error(f"Failed to start the application: {e}")









