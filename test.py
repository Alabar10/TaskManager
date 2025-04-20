import os
import requests
from dotenv import load_dotenv

load_dotenv()

email = os.getenv("JIRA_EMAIL")
api_token = os.getenv("JIRA_API_TOKEN")
domain = os.getenv("JIRA_DOMAIN")

url = f"https://{domain}/rest/api/3/search"
auth = (email, api_token)

params = {
    "jql": 'assignee=currentUser() AND statusCategory != Done ORDER BY due ASC',
    "maxResults": 5,
    "fields": "summary,duedate,status"
}

headers = {
    "Accept": "application/json"
}

response = requests.get(url, headers=headers, params=params, auth=auth)

if response.status_code == 200:
    data = response.json()
    issues = data.get("issues", [])
    
    if not issues:
        print("✅ Connection OK, but no issues found for current user.")
    else:
        for issue in issues:
            print(f"{issue['key']} | {issue['fields']['summary']} | Due: {issue['fields'].get('duedate')}")
else:
    print("❌ Error:", response.status_code, response.text)
