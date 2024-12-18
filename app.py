from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskmanager.db'  # Change to your SQL Server URI if using SQL Server
db = SQLAlchemy(app)

@app.route('/api', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Task Manager API!"})

if __name__ == '__main__':
    app.run(debug=True)
