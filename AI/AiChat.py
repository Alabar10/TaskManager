import requests
import json
import os
import re
from dotenv import load_dotenv
from datetime import datetime, timedelta
from pytz import timezone

load_dotenv()

HF_TOKEN = os.getenv("HF_API_KEY")
MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

def is_small_talk(text):
    cleaned = re.sub(r'[^\w\s]', '', text.lower().strip())
    phrases = [
        "hi", "hello", "hey", "how are you", "whats up", "yo",
        "any advice", "any tips", "help", "motivation", "can you help",
        "some advice", "anything to suggest"
    ]
    return cleaned in phrases

def is_urgent_query(message):
    # Add more if needed
    queries = [
        "urgent", "priority", "what is urgent", "what's urgent",
        "most important", "what should i do first", "what should i focus",
        "next", "which task is urgent", "urgent task", "due soon",
        "deadline", "what should i do now", "which group task is urgent"
    ]
    msg = message.lower()
    return any(q in msg for q in queries)

def format_due_date(task):
    deadline_str = task.get('deadline')
    if not deadline_str:
        return None
    try:
        deadline = datetime.strptime(deadline_str, '%Y-%m-%dT%H:%M:%S.%fZ')
        now = datetime.utcnow()
        delta = deadline - now
        if delta.total_seconds() < 0:
            return None
        elif delta.days == 0:
            return f"{task['title']} — due today"
        elif delta.days == 1:
            return f"{task['title']} — due tomorrow"
        else:
            return f"{task['title']} — due in {delta.days} days"
    except Exception:
        return None

def find_most_urgent(tasks):
    # Filter for tasks with valid deadline and not completed
    future_tasks = [
        t for t in tasks
        if t.get("status") not in ("completed", "done")
        and t.get("deadline")
    ]
    if not future_tasks:
        return None
    # Sort by deadline (soonest), then by priority if available
    def task_sort_key(t):
        try:
            dt = datetime.strptime(t['deadline'], '%Y-%m-%dT%H:%M:%S.%fZ')
        except Exception:
            dt = datetime.max
        priority = t.get('priority', 999)
        return (dt, priority)
    urgent = sorted(future_tasks, key=task_sort_key)
    return urgent[0] if urgent else None

def summarize_task(task):
    deadline_msg = format_due_date(task) or "No deadline"
    prio = f"Priority: {task.get('priority')}" if task.get('priority') else ""
    return f"{task.get('title', 'Unnamed Task')} ({deadline_msg}) {prio}".strip()

def generate_ai_advice(message, schedule_json, personal_tasks, group_tasks, urgent_tasks, user_name="there"):
    if not HF_TOKEN:
        return "❌ Missing Hugging Face API token. Check your .env setup."
    
    # Filter tasks (not completed)
    personal_tasks = [t for t in personal_tasks if t.get('status') not in ("completed", "done")]
    group_tasks = [t for t in group_tasks if t.get('status') not in ("completed", "done")]
    urgent_tasks = [t for t in urgent_tasks if t.get('status') not in ("completed", "done")]

    today = datetime.now(timezone('Asia/Jerusalem'))
    formatted_date = today.strftime("%A, %B %d, %Y")
    part_of_day = "morning" if today.hour < 12 else "afternoon" if today.hour < 17 else "evening"

    # 1. Urgency queries
    if is_urgent_query(message):
        all_tasks = personal_tasks + group_tasks + urgent_tasks
        urgent_task = find_most_urgent(all_tasks)
        if urgent_task:
            summary = summarize_task(urgent_task)
            prompt = f"""
You are FocusMate, an empathetic productivity coach.  
Answer the user’s question as a supportive human assistant.

Today is {formatted_date} ({part_of_day}).

Identify the single most urgent task for the user, explain *briefly* why it's urgent, and suggest a clear next step.  
Be warm, not robotic. Encourage the user to take action.

Most urgent task: {summary}

Reply in less than 60 words. Do not repeat the user's question or message.
            """
        else:
            prompt = f"""
You are FocusMate, a supportive productivity coach.  
Answer the user’s question as a helpful assistant.

Today is {formatted_date}.

You checked all current tasks and found none that are urgent right now.  
Reassure the user, suggest reviewing priorities or planning ahead, and encourage them to stay positive.

Do not repeat the user's question or message.
            """

    # 2. Small talk
    elif is_small_talk(message):
        prompt = f"""
You are FocusMate, a friendly productivity assistant.

It's the {part_of_day} on {formatted_date}.

Greet {user_name} with positive energy, and give one or two practical tips for focus or motivation (e.g., 5-minute rule, Pomodoro, etc).  
Keep it casual, never list tasks, and never repeat the user's message.
        """

    # 3. Group task questions
    elif "group task" in message.lower():
        upcoming = sorted(
            [format_due_date(t) for t in group_tasks if t.get('deadline')],
            key=lambda x: x if x else '',
        )
        group_deadlines = "\n".join(f"- {x}" for x in upcoming if x) or "No group tasks with upcoming deadlines."
        prompt = f"""
You are FocusMate, a smart productivity coach.

Today is {formatted_date} ({part_of_day}).

Share the most important upcoming group deadlines, and suggest one step the user can take to move forward.  
Be practical, friendly, and never repeat the user's question or message.

Upcoming group deadlines:
{group_deadlines}
        """

    # 4. General planning/advice
    else:
        personal_summary = "\n".join([
            f"- {summarize_task(t)}" for t in personal_tasks
        ]) or "No personal tasks."
        group_summary = "\n".join([
            f"- {summarize_task(t)}" for t in group_tasks
        ]) or "No group tasks."
        urgent_summary = "\n".join([
            f"- {summarize_task(t)}" for t in urgent_tasks
        ]) or "None."

        schedule_note = json.dumps(schedule_json, indent=2) if schedule_json else "No schedule available."

        prompt = f"""
You are FocusMate, a smart, supportive productivity coach.

Today is {formatted_date} ({part_of_day}).

Weekly Schedule: {schedule_note}

Personal Tasks:
{personal_summary}

Group Tasks:
{group_summary}

Urgent Tasks:
{urgent_summary}

Give concise, realistic planning advice for what the user should do next.  
Encourage them to take one step at a time and finish with a positive note.  
Never repeat the user's message.
        """

    # Send to Hugging Face
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 120,
            "temperature": 0.7,
            "top_k": 40,
            "top_p": 0.92,
            "do_sample": True,
            "return_full_text": False
        }
    }

    try:
        response = requests.post(
            f"https://api-inference.huggingface.co/models/{MODEL_ID}",
            headers=headers,
            data=json.dumps(payload)
        )

        if response.status_code == 503:
            return "⏳ The model is still loading. Please try again in a moment."

        if response.status_code == 200:
            result = response.json()
            generated = result[0].get('generated_text') or result[0].get('text')
            return generated.strip() if generated else "⚠️ AI responded, but gave no content."
        else:
            error_message = response.json().get("error", "Unknown error")
            return f"❌ Hugging Face Error: {error_message}"
    except Exception as e:
        return f"❌ Exception occurred: {str(e)}"
