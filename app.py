from flask import Flask, jsonify
from flask_cors import CORS  # Importing CORS
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mssql+pyodbc://database:task1234!@taskmanager.database.windows.net:1433/TaskManagerDB?driver=ODBC+Driver+17+for+SQL+Server'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking

db = SQLAlchemy(app)


@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = [
        {"id": 1, "title": "Task 1"},
        {"id": 2, "title": "Task 2"},
        {"id": 3, "title": "Task 3"},
    ]
    return jsonify({"tasks": tasks})

if __name__ == '__main__':
    app.run(debug=True)
