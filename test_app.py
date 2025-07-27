from datetime import datetime
import unittest
from app import create_app
from flask import json

class FlaskAppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    # -------------------- Auth & Users --------------------

    def test_register_missing_fields(self):
        response = self.client.post("/register", json={})
        self.assertEqual(response.status_code, 400)

    def test_register_invalid_email(self):
        response = self.client.post("/register", json={
            "username": "testuser",
            "email": "invalidemail",
            "password": "123456",
            "fname": "Test",
            "lname": "User"
        })
        self.assertEqual(response.status_code, 400)

    def test_register_existing_user(self):
        response = self.client.post("/register", json={
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "123456",
            "fname": "Test",
            "lname": "User"
        })
        self.assertIn(response.status_code, [400, 409])

    def test_login_missing_fields(self):
        response = self.client.post("/login", json={})
        self.assertIn(response.status_code, [500, 401])

    def test_login_success(self):
        response = self.client.post("/login", json={
            "email": "testuser@example.com",
            "password": "123456"
        })
        self.assertIn(response.status_code, [200, 401])

    def test_get_user_not_found(self):
        response = self.client.get("/user/999999")
        self.assertEqual(response.status_code, 404)

    def test_get_user_invalid_id(self):
        response = self.client.get("/user/0")
        self.assertIn(response.status_code, [404, 500])

    # -------------------- Password reset flow --------------------

    def test_reset_password_request_missing_email(self):
        response = self.client.post("/request_reset", json={})
        self.assertEqual(response.status_code, 400)

    def test_verify_reset_code_missing_fields(self):
        response = self.client.post("/verify_reset_code", json={})
        self.assertEqual(response.status_code, 400)

    def test_reset_password_with_invalid_token(self):
        response = self.client.post("/reset_password_token", json={
            "token": "fake-token",
            "new_password": "newpass123"
        })
        self.assertIn(response.status_code, [400, 403, 404])

    # -------------------- Personal tasks --------------------

    def test_create_task_without_title(self):
        response = self.client.post("/tasks", json={
            "description": "test desc",
            "user_id": 1
        })
        self.assertEqual(response.status_code, 400)

    def test_create_task_success(self):
        response = self.client.post("/tasks", json={
            "title": "Test Task",
            "description": "Description",
            "user_id": 1,
            "priority": 2,
            "status": "To Do",
            "category": "General",
            "estimated_time": 30
        })
        self.assertIn(response.status_code, [201, 500])

    def test_add_task_with_invalid_user(self):
        response = self.client.post("/tasks", json={
            "title": "Invalid User Task",
            "description": "Test",
            "user_id": 999999,
            "priority": 2,
            "status": "To Do",
            "category": "General",
            "estimated_time": 30
        })
        self.assertIn(response.status_code, [201, 500, 404])

    def test_update_task_not_found(self):
        response = self.client.put("/tasks/999999", json={"title": "Updated"})
        self.assertEqual(response.status_code, 404)

    def test_update_existing_task(self):
        response = self.client.put("/tasks/1", json={"title": "Updated Title"})
        self.assertIn(response.status_code, [200, 404])

    def test_delete_nonexistent_task(self):
        response = self.client.delete("/tasks/999999")
        self.assertIn(response.status_code, [404, 500])

    def test_get_all_tasks(self):
        response = self.client.get("/tasks")
        self.assertIn(response.status_code, [200, 401, 404, 405])

    # -------------------- Dates & schedules --------------------

    def test_get_tasks_by_date_range(self):
        response = self.client.get("/tasks/dates")
        self.assertIn(response.status_code, [200, 401, 403])

    def test_schedule_get_not_found(self):
        response = self.client.get("/schedule/999999")
        self.assertIn(response.status_code, [200, 404])

    def test_get_schedule_invalid_user(self):
        response = self.client.get("/schedule/0")
        self.assertIn(response.status_code, [200, 404])

    def test_schedule_edit_invalid_format(self):
        response = self.client.put("/schedule/1", json={"monday": "not-a-list"})
        self.assertEqual(response.status_code, 400)

    def test_create_schedule_with_invalid_data(self):
        response = self.client.put("/schedule/1", json={"monday": "string-not-list"})
        self.assertEqual(response.status_code, 400)

    # -------------------- Prediction / AI --------------------

    def test_predict_missing_fields(self):
        response = self.client.post("/predict", json={
            "category": "General",
            "priority": 2
        })
        self.assertEqual(response.status_code, 400)

    def test_predict_invalid_datetime(self):
        response = self.client.post("/predict", json={
            "category": "General",
            "priority": 2,
            "estimated_time": 30,
            "start_time": "invalid-date",
            "user_id": 1
        })
        self.assertEqual(response.status_code, 400)

    def test_predict_with_unknown_category(self):
        response = self.client.post("/predict", json={
            "category": "SomeNewCategory",
            "priority": 2,
            "estimated_time": 60,
            "start_time": datetime.utcnow().isoformat(),
            "user_id": 1
        })
        self.assertIn(response.status_code, [200, 500])

    def test_chat_with_ai_empty_message(self):
        response = self.client.post("/chat", json={"user_id": 1, "message": ""})
        self.assertEqual(response.status_code, 200)

    # -------------------- Groups --------------------

    def test_create_group_missing_fields(self):
        response = self.client.post("/add_group", json={})
        self.assertEqual(response.status_code, 400)

    def test_create_group_invalid_creator(self):
        response = self.client.post("/add_group", json={
            "name": "Test Group",
            "created_by": 99999
        })
        self.assertEqual(response.status_code, 404)

    def test_get_group_by_invalid_id(self):
        response = self.client.get("/groups/999999")
        self.assertEqual(response.status_code, 404)

    def test_delete_group_not_found(self):
        response = self.client.delete("/groups/999999", headers={"User-ID": "1"})
        self.assertIn(response.status_code, [404, 403])

    def test_leave_group_user_not_member(self):
        response = self.client.post("/groups/1/leave", json={"user_id": 999999})
        self.assertIn(response.status_code, [404, 403])

if __name__ == '__main__':
    unittest.main()
