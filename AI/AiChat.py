import requests
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

HF_TOKEN = os.getenv("HF_API_KEY")
MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}

def generate_ai_advice(message, schedule_json, personal_tasks, group_tasks, urgent_tasks):
    small_talk_messages = [
        "hi", "hello", "hey", "how are you", "what's up", "yo", "?", "what?", 
        "any advice?", "any tips?", "help?", "motivation?", "can you help?", "some advice?", "anything to suggest?"
    ]

    # 🧠 Prepare summaries
    personal_tasks = [t for t in personal_tasks if t.get('status') != 'completed']
    group_tasks = [t for t in group_tasks if t.get('status') != 'completed']
    urgent_tasks = [t for t in urgent_tasks if t.get('status') != 'completed']

    personal_summary = "\n".join([f"- {t['title']} (Deadline: {t.get('deadline', 'N/A')})" for t in personal_tasks]) or "No personal tasks."
    group_summary = "\n".join([f"- {t['title']} (Deadline: {t.get('deadline', 'N/A')})" for t in group_tasks]) or "No group tasks."
    urgent_summary = "\n".join([f"- {t['title']} (Deadline: {t.get('deadline', 'N/A')})" for t in urgent_tasks]) or "No urgent tasks."
    schedule_note = schedule_json if schedule_json else "No schedule available."

    today = datetime.now()
    formatted_date = today.strftime("%A, %B %d, %Y")
    hour = today.hour
    part_of_day = "morning" if hour < 12 else "afternoon" if hour < 17 else "evening"

    # 🛠 Select the correct prompt
    if message.lower().strip() in small_talk_messages:
        # 🌟 Small-talk: simple motivational response
        prompt = f"""
        You are a smart scheduling and productivity assistant.
        The user is seeking general advice to stay motivated and productive.

        📅 Today is {formatted_date}, and it's the {part_of_day}.

        🎯 Your job:
        - Give a motivational, positive, and practical advice in 3–5 sentences.
        - Encourage time management, healthy breaks, and energy balance.
        - DO NOT mention specific tasks or schedules.
        """
    else:
        # 🧠 Full detailed task-oriented response
        prompt = f"""
        You are a smart and concise scheduling assistant that helps users manage their tasks and time efficiently. 
        Today is {formatted_date}, and it's currently the {part_of_day}.

        The user is seeking advice about their tasks, productivity, or time management.
        Your role is to **analyze the user's context** and respond directly with helpful, short advice.

        ❗Important:
        - NEVER repeat or mention the user's question.
        - Focus only on answering what they need.
        - Keep your response short: 3–5 sentences.
        - Use natural, supportive language like a helpful assistant.

        🧠 Context:
        - User's weekly schedule:
        {schedule_note}

        - Personal tasks (incomplete):
        {personal_summary}

        - Group tasks (incomplete):
        {group_summary}

        - Urgent tasks (due within 2 days and incomplete):
        {urgent_summary}

        🎯 Behavior rules:
        - If the user asks about group tasks, list and prioritize group tasks.
        - If the user asks about personal tasks, list and prioritize personal tasks.
        - If the user asks about urgent tasks, focus on urgent tasks.
        - If the user asks generally about productivity, give general advice about time management and rest.

        📌 Do not mention dates or times exactly. Just say "soon", "urgent", etc.
        """

    # 📡 Send request to Hugging Face
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 180,
            "temperature": 0.75,   
            "top_k": 50,
            "top_p": 0.95,
            "do_sample": True,
            "return_full_text": False
        }
    }

    response = requests.post(
        f"https://api-inference.huggingface.co/models/{MODEL_ID}",
        headers=headers,
        data=json.dumps(payload)
    )

    # 🧹 Handle response
    if response.status_code == 200:
        try:
            result = response.json()
            generated = result[0].get('generated_text') or result[0].get('generated_token_strings')
            if generated:
                return generated.strip()
            else:
                return "⚠️ AI responded, but no content found."
        except Exception as e:
            return f"❌ Hugging Face JSON Error: {str(e)}"
    else:
        try:
            error_message = response.json().get("error", "Unknown error")
        except Exception:
            error_message = response.text or "No response body"
        return f"❌ Hugging Face Error: {error_message}"
