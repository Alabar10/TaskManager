import pandas as pd
import random
from datetime import datetime, timedelta

# Define table structure
columns = [
    "id", "title", "description", "due_date", "deadline", "priority", "status", "user_id",
    "created_at", "updated_at", "category", "actual_time", "time_taken", "start_time", "estimated_time"
]

# Sample categories
categories = ["coding", "writing", "reading", "exercising", "General", "meeting", "designing"]

# Sample statuses
statuses = ["To Do", "In Progress", "Done", "Completed"]

# Generate realistic task data
task_data = []
for i in range(36, 51):  # Generating 15 tasks
    title = f"Task {i}"
    description = f"Description for {title}."
    user_id = random.randint(1, 3)  # Assume 3 users
    category = random.choice(categories)
    priority = random.randint(1, 3)
    status = random.choice(statuses)

    # Generate timestamps
    created_at = datetime(2025, 3, random.randint(1, 18), random.randint(8, 20), random.randint(0, 59))
    due_date = created_at + timedelta(days=random.randint(1, 15))
    deadline = due_date + timedelta(days=random.randint(1, 10))
    updated_at = created_at + timedelta(days=random.randint(1, 5))

    # Generate start and completion times
    start_time = created_at + timedelta(hours=random.randint(0, 48))
    actual_time = start_time + timedelta(hours=random.randint(1, 100))
    time_taken = f"{(actual_time - start_time).days * 24 + (actual_time - start_time).seconds // 3600} hours, {(actual_time - start_time).seconds // 60 % 60} minutes"

    # Estimated time (random values)
    estimated_time = random.randint(30, 6000)  # Estimated in minutes

    # Handle tasks not completed yet
    if status in ["To Do", "In Progress"]:
        actual_time, time_taken, start_time = None, None, None

    task_data.append([i, title, description, due_date, deadline, priority, status, user_id,
                      created_at, updated_at, category, actual_time, time_taken, start_time, estimated_time])

# Convert to DataFrame
df_tasks = pd.DataFrame(task_data, columns=columns)

# Save to CSV
df_tasks.to_csv("task_data.csv", index=False)

print("✅ Task data generated and saved as 'task_data.csv'.")
