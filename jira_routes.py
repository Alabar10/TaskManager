from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User  # Adjust path if needed
from extensions import db  # Adjust path if needed
import requests
import os
from dotenv import load_dotenv
load_dotenv()

jira_bp = Blueprint("jira", __name__)

@jira_bp.route("/jira/issues", methods=["GET"])
@jwt_required()
def get_jira_issues():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.jira_email or not user.jira_api_token or not user.jira_domain:
        return jsonify([]), 200

    url = f"https://{user.jira_domain}/rest/api/3/search"
    auth = (user.jira_email, user.jira_api_token)

    params = {
        "jql": 'assignee=currentUser() AND statusCategory != Done ORDER BY due ASC',
        "maxResults": 10,
        "fields": "summary,description,duedate,status,assignee,reporter,project,created,updated"
    }

    headers = {
        "Accept": "application/json"
    }

    response = requests.get(url, headers=headers, params=params, auth=auth)

    if response.status_code == 200:
        issues = response.json().get("issues", [])
        formatted_issues = []
        for issue in issues:
            fields = issue["fields"]
            formatted_issues.append({
                "id": issue["id"],
                "title": fields.get("summary"),
                "description": fields.get("description", ""),
                "deadline": fields.get("duedate"),
                "status": fields.get("status", {}).get("name", "Unknown"),
                "assignee": {
                    "displayName": fields.get("assignee", {}).get("displayName", "Unassigned"),
                    "emailAddress": fields.get("assignee", {}).get("emailAddress", "")
                } if fields.get("assignee") else None,
                "reporter": {
                    "displayName": fields.get("reporter", {}).get("displayName", "Unknown"),
                    "emailAddress": fields.get("reporter", {}).get("emailAddress", "")
                } if fields.get("reporter") else None,
                "project": fields.get("project", {}).get("name", "Unknown"),
                "created": fields.get("created"),
                "updated": fields.get("updated")
            })
        return jsonify(formatted_issues)
    else:
        return jsonify({"error": response.text}), response.status_code


@jira_bp.route('/jira/manual-connect', methods=['POST'])
def save_jira_manual():
    data = request.get_json()
    user_id = data.get('user_id')
    email = data.get('email')
    token = data.get('token')
    domain = data.get('domain')

    if not all([user_id, email, token, domain]):
        return jsonify({'message': 'Missing Jira details'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    user.jira_email = email
    user.jira_api_token = token
    user.jira_domain = domain
    db.session.commit()

    return jsonify({'message': 'Jira details saved successfully'})


@jira_bp.route("/jira/test-fetch", methods=["POST"])
def fetch_jira_tasks_directly():
    data = request.get_json()
    email = data.get("email")
    token = data.get("token")
    domain = data.get("domain")

    if not all([email, token, domain]):
        return jsonify({"error": "Missing Jira credentials"}), 400

    url = f"https://{domain}/rest/api/3/search"
    auth = (email, token)

    params = {
        "jql": 'assignee=currentUser() AND statusCategory != Done ORDER BY due ASC',
        "maxResults": 10,
        "fields": "summary,duedate,status"
    }

    headers = {
        "Accept": "application/json"
    }

    response = requests.get(url, headers=headers, params=params, auth=auth)

    if response.status_code == 200:
        issues = response.json().get("issues", [])
        formatted_issues = [
            {
                "id": issue["id"],
                "title": issue["fields"]["summary"],
                "deadline": issue["fields"].get("duedate"),
                "status": issue["fields"]["status"]["name"]
            }
            for issue in issues
        ]
        return jsonify(formatted_issues)
    else:
        return jsonify({"error": response.text}), response.status_code
