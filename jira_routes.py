from flask import Blueprint, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

jira_bp = Blueprint("jira", __name__)  

@jira_bp.route("/jira/issues", methods=["GET"])
def get_jira_issues():
    email = os.getenv("JIRA_EMAIL")
    api_token = os.getenv("JIRA_API_TOKEN")
    domain = os.getenv("JIRA_DOMAIN")

    url = f"https://{domain}/rest/api/3/search"
    auth = (email, api_token)

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
