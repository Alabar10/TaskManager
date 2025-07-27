import requests
import json
import os
import re
from datetime import datetime
from pytz import timezone
from dotenv import load_dotenv

load_dotenv()

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
TOGETHER_MODEL = "mistralai/Mistral-7B-Instruct-v0.1"

headers = {
    "Authorization": f"Bearer {TOGETHER_API_KEY}",
    "Content-Type": "application/json"
}

# ---------- Query Type Helpers ----------
def is_small_talk(text):
    cleaned = re.sub(r'[^\w\s]', '', text.lower().strip())
    return cleaned in [
        "hi", "hello", "hey", "how are you", "whats up", "yo",
        "any advice", "any tips", "help", "motivation", "can you help",
        "some advice", "anything to suggest"
    ]

def is_urgent_query(msg):
    keywords = [
        "urgent", "priority", "what is urgent", "what's urgent", "most important",
        "what should i do first", "what should i focus", "next", "urgent task",
        "due soon", "deadline", "what should i do now", "which group task is urgent"
    ]
    return any(k in msg.lower() for k in keywords)

def is_time_query(text):
    return any(p in text.lower() for p in [
        "what time is it", "current time", "now time", "tell me the time",
        "what's the time", "what is the time", "what day is it", "date today", "today's date"
    ])

def is_status_query(msg):
    return any(s in msg.lower() for s in ["to do", "in progress", "done", "completed", "not started"])

def is_personal_task_query(msg):
    msg = msg.lower()
    return ("personal task" in msg or 
            "my task" in msg or 
            "personal to do" in msg or
            "my to do" in msg)

def is_group_task_query(msg):
    msg = msg.lower()
    return ("group task" in msg or 
            "team task" in msg or 
            "group to do" in msg or
            "team to do" in msg)

def extract_requested_status(msg):
    msg = msg.lower()
    if "in progress" in msg: return "in progress"
    if "to do" in msg or "todo" in msg: return "to do"
    if "done" in msg or "completed" in msg: return "completed"
    if "not started" in msg: return "not started"
    return None

# ---------- Task Formatters ----------
def parse_deadline(deadline_str):
    formats = [
        '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%d %H:%M:%S.%f',
        '%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d'
    ]
    for fmt in formats:
        try:
            return datetime.strptime(deadline_str, fmt)
        except:
            continue
    return None

def format_due_date(task):
    deadline = parse_deadline(task.get('deadline', ''))
    if not deadline:
        return "No deadline"
    now = datetime.utcnow()
    delta = deadline - now
    if delta.total_seconds() < 0:
        return "overdue"
    elif delta.days == 0:
        return "due today"
    elif delta.days == 1:
        return "due tomorrow"
    else:
        return f"due in {delta.days} days"

def priority_label(priority):
    labels = {
        1: "Important and Urgent",
        2: "Important but Not Urgent",
        3: "Not Important but Urgent",
        4: "Not Important and Not Urgent"
    }
    try:
        return labels.get(int(priority), f"Priority {priority}")
    except:
        return f"Priority {priority}"

def summarize_task(task):
    title = task.get('title', 'Unnamed Task')
    deadline_msg = format_due_date(task)
    prio = priority_label(task.get('priority'))
    return f"{title} — {deadline_msg} | {prio}"

# ---------- Urgent Task Logic ----------
def find_most_urgent(tasks):
    future_tasks = [t for t in tasks if t.get("status", "").lower() not in ("completed", "done") and t.get("deadline")]
    if not future_tasks:
        return None
    return sorted(future_tasks, key=lambda t: (
        parse_deadline(t.get("deadline")) or datetime.max,
        int(t.get("priority", 999))
    ))[0]

# ---------- Main AI Generator ----------
def generate_ai_advice(message, schedule_json, personal_tasks, group_tasks, urgent_tasks, user_name="there"):
    if not TOGETHER_API_KEY:
        return "❌ Missing Together.ai API key."

    # Filter out completed tasks
    personal_tasks = [t for t in personal_tasks if t.get('status', '').lower() not in ("completed", "done")]
    group_tasks = [t for t in group_tasks if t.get('status', '').lower() not in ("completed", "done")]
    urgent_tasks = [t for t in urgent_tasks if t.get('status', '').lower() not in ("completed", "done")]

    now = datetime.now(timezone("Asia/Jerusalem"))
    date_str = now.strftime("%A, %B %d, %Y")
    time_str = now.strftime("%H:%M")
    part_of_day = "morning" if now.hour < 12 else "afternoon" if now.hour < 17 else "evening"

    # --- Message Type Routing ---
    if is_status_query(message):
        status = extract_requested_status(message)
        if not status:
            return "I couldn't determine which task status you meant."

        match = lambda t: t.get("status", "").lower() == status
        
        # Check if specifically asking for personal or group tasks
        if is_personal_task_query(message):
            tasks = [summarize_task(t) for t in personal_tasks if match(t)]
            if not tasks:
                return f"You have no personal tasks with status '{status}'."
            return f"Here are your personal tasks with status **{status}**:\n" + "\n".join(f"- {t}" for t in tasks)
        
        elif is_group_task_query(message):
            tasks = [summarize_task(t) for t in group_tasks if match(t)]
            if not tasks:
                return f"You have no group tasks with status '{status}'."
            return f"Here are your group tasks with status **{status}**:\n" + "\n".join(f"- {t}" for t in tasks)
        
        else:  # Show both if not specified
            personal = [summarize_task(t) for t in personal_tasks if match(t)]
            group = [summarize_task(t) for t in group_tasks if match(t)]

            if not personal and not group:
                return f"You have no tasks with status '{status}'."

            response = f"Here are your tasks with status **{status}**:\n"
            if personal:
                response += "\n🟢 *Personal Tasks:*\n" + "\n".join(f"- {t}" for t in personal)
            if group:
                response += "\n🔵 *Group Tasks:*\n" + "\n".join(f"- {t}" for t in group)
            return response

    elif is_urgent_query(message):
        urgent = find_most_urgent(personal_tasks + group_tasks + urgent_tasks)
        if urgent:
            summary = summarize_task(urgent)
            prompt = f"""You are FocusMate. Today is {date_str} ({part_of_day}).
Suggest a next step based on the most urgent task:
{summary}"""
        else:
            prompt = f"""You are FocusMate. Today is {date_str}.
There are no urgent tasks. Encourage the user to review priorities or take a short productive action."""

    elif is_time_query(message):
        prompt = f"""It's {time_str} on {date_str} (Asia/Jerusalem).
Give the user this info and one motivational tip to stay productive."""

    elif is_small_talk(message):
        prompt = f"""It's the {part_of_day} on {date_str}.
Greet {user_name} warmly. Offer two productivity tips like Pomodoro or task batching."""

    elif is_group_task_query(message):
        deadlines = "\n".join(f"- {summarize_task(t)}" for t in group_tasks) or "No group tasks."
        prompt = f"""Today is {date_str} ({part_of_day}).
Here are your group tasks:
{deadlines}
Suggest a useful action to move one of them forward."""

    elif is_personal_task_query(message):
        deadlines = "\n".join(f"- {summarize_task(t)}" for t in personal_tasks) or "No personal tasks."
        prompt = f"""Today is {date_str} ({part_of_day}).
Here are your personal tasks:
{deadlines}
Suggest what to focus on next."""

    else:
        schedule_note = json.dumps(schedule_json, indent=2) if schedule_json else "No schedule available."
        personal_summary = "\n".join(f"- {summarize_task(t)}" for t in personal_tasks) or "No personal tasks."
        group_summary = "\n".join(f"- {summarize_task(t)}" for t in group_tasks) or "No group tasks."
        urgent_summary = "\n".join(f"- {summarize_task(t)}" for t in urgent_tasks) or "None."

        prompt = f"""Today is {date_str} ({part_of_day}).
Schedule: {schedule_note}
🟢 Personal Tasks:\n{personal_summary}
🔵 Group Tasks:\n{group_summary}
❗ Urgent Tasks:\n{urgent_summary}
Give clear, actionable planning advice. Suggest one next step."""

    payload = {
        "model": TOGETHER_MODEL,
        "messages": [
            {"role": "system", "content": "You are FocusMate, a helpful productivity coach."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 200,
        "temperature": 0.7,
        "top_p": 0.9
    }

    try:
        res = requests.post("https://api.together.xyz/v1/chat/completions", headers=headers, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"❌ Together.ai error: {e}" 