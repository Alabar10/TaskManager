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

def generate_ai_advice(message, schedule_json, personal_tasks, group_tasks, urgent_tasks,user_name="there"):
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
            You are FocusMate, a smart and encouraging productivity assistant.

            Start your message with a friendly greeting like “Hi {user_name}! I’m FocusMate...”

                
            📅 Today is {formatted_date}  
            🕒 It's currently the {part_of_day}

            The user is looking for motivation to stay productive.

            Respond with a short, supportive message in 3–5 sentences. Begin with a friendly greeting like "Hi! I'm FocusMate..." and offer:
            - Encouragement to stay focused
            - One or two helpful strategies (e.g., taking breaks, time-blocking, starting small)
            - A warm, positive tone

            Do not mention specific tasks, deadlines, or schedules. Keep it general and uplifting.
            """


    else:
        # 🧠 Full detailed task-oriented response
        prompt = f"""
            You are FocusMate, a smart, supportive productivity assistant that helps users plan their tasks and time efficiently.

            📅 Today is {formatted_date} (YYYY-MM-DD)  
            🕒 Current part of the day: {part_of_day}

            Write only FocusMate's message. Do not include a user reply or follow-up.

            

            🧠 Weekly Schedule:  
            {schedule_note}

            🗂️ Personal Tasks:  
            {personal_summary}

            👥 Group Tasks:  
            {group_summary}

            ⏰ Urgent Tasks (due within 2 days):  
            {urgent_summary}

            

            Tips for how to reply:
            - Be supportive, concise, and realistic  
            - Focus on what matters most today or soon  
            - If no schedule is available, suggest starting with personal or urgent tasks  
            - Avoid robotic tone — speak naturally  
            - Do **not** repeat the user’s question or re-list this data
            """




    # 📡 Send request to Hugging Face
    payload = {
        "inputs": prompt,  # ✅ just the prompt string
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
            generated = result[0].get('generated_text') or result[0].get('text')
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
