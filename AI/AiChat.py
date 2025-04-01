import requests
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

HF_TOKEN = os.getenv("HF_API_KEY")  # Make sure your key is set in .env or passed securely
MODEL_ID = "HuggingFaceH4/zephyr-7b-alpha"  # You can use other models like `tiiuae/falcon-7b-instruct` if needed

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

def generate_ai_advice(message, schedule_json, personal_tasks, group_tasks, urgent_tasks):
    # ✅ Filter out completed tasks
    personal_tasks = [t for t in personal_tasks if t.get('status') != 'completed']
    group_tasks = [t for t in group_tasks if t.get('status') != 'completed']
    urgent_tasks = [t for t in urgent_tasks if t.get('status') != 'completed']

    # 🧾 Build readable summaries
    personal_summary = "\n".join(
        [f"- {t['title']} (Deadline: {t.get('deadline', 'N/A')})" for t in personal_tasks]
    ) or "No personal tasks."

    group_summary = "\n".join(
        [f"- {t['title']} (Deadline: {t.get('deadline', 'N/A')})" for t in group_tasks]
    ) or "No group tasks."

    urgent_summary = "\n".join(
        [f"- {t['title']} (Deadline: {t.get('deadline', 'N/A')})" for t in urgent_tasks]
    ) or "No urgent tasks."

    schedule_note = schedule_json if schedule_json else "No schedule available."

    # 📅 Include today's actual date so AI knows what "today" means
    today = datetime.now()
    formatted_date = today.strftime("%A, %B %d, %Y")  # Example: Tuesday, April 01, 2025
    # Determine current part of day
    hour = datetime.now().hour
    if hour < 12:
        part_of_day = "morning"
    elif 12 <= hour < 17:
        part_of_day = "afternoon"
    else:
        part_of_day = "evening"


    # 🧠 Final AI prompt
    prompt = f"""
    You are a smart and concise scheduling assistant helping users manage their time and tasks effectively.
    You can greet the user based on the time of day (e.g., "Good morning"), but keep it concise and friendly.

    📅 Today is: {formatted_date}, and it's currently the {part_of_day}.

    The user asked: "{message}"

    ✅ Weekly schedule:
    {schedule_note}

    🧾 Personal tasks (incomplete):
    {personal_summary}

    👥 Group tasks (incomplete):
    {group_summary}

    ⚠️ Urgent tasks (due within 2 days and incomplete):
    {urgent_summary}

    📌 Important:
    - Do **not** include exact due dates or timestamps in your reply.
    - If a task is overdue or due soon, just say it's "urgent", "high priority", or "should be done today".
    - If the user has many tasks scheduled without breaks, recommend adding rest periods to maintain focus.
    - If the user has urgent tasks and limited free time, suggest they adjust or clear their schedule to focus on those.
    - Encourage time management, energy balancing, and motivation.
    - Use natural, supportive language like a helpful assistant.

    🎯 Your job:
    Give the user practical advice: what should they focus on today? Which tasks are urgent? 
    How can they stay productive without burnout? Suggest adjustments to the schedule if needed.
    Reply in 3–5 sentences.

    """


    # 📡 Send request to Hugging Face Inference API
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 150,
            "temperature": 0.7,
            "top_k": 50,
            "do_sample": True,
            "return_full_text": False  
        }
    }


    response = requests.post(
        f"https://api-inference.huggingface.co/models/{MODEL_ID}",
        headers=headers,
        data=json.dumps(payload)
    )

        # 🔁 Handle response
    if response.status_code == 200:
        try:
            result = response.json()
            generated = result[0].get('generated_text') or result[0].get('generated_token_strings')
            if generated:
                return generated.strip()
            else:
                return "⚠️ AI responded, but no content was found."
        except Exception as e:
            return f"❌ Hugging Face JSON Error: {str(e)}"

    else:
        try:
            error_message = response.json().get("error", "Unknown error")
        except Exception:
            error_message = response.text or "No response body"
        return f"❌ Hugging Face Error: {error_message}"