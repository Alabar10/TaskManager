# 🚀 TaskManager App – Expo & Flask Fullstack Guide

This is a fullstack project built with:

- **Frontend**: [Expo (React Native)](https://expo.dev)
- **Backend**: Flask (Python)
- **Database**: Azure SQL Server

---

📋 About the Project

TaskManager is a productivity app that helps individuals and teams manage their time effectively. It combines smart scheduling, AI-powered task predictions, and group collaboration tools. Users can plan weekly schedules, estimate task durations, and get personalized advice on task priorities — all in a sleek mobile interface built with Expo and powered by a Flask backend connected to SQL Server.

## video Link For The Project:
https://drive.google.com/file/d/1k9k6SNJTdw5AbPrLn8ygRQLvg8L6EBQL/view?usp=sharing

## 🧹 Project Structure

```bash
TaskManager/
│
├── TaskManagerExpo/         # Frontend (Expo React Native app)
├── backend/                 # Backend (Flask API)
├── README.md                # You are here
```

---

## 🔧 Prerequisites

- **Node.js** and **npm** installed
- **Python 3.11+**
- **Expo CLI**: `npm install -g expo-cli`
- **Flask**: `pip install flask`
- **Virtual environment tools** (optional but recommended)

---

## ▶️ How to Run the App

### 1. 📱 Frontend – Expo (React Native)

#### ✅ Step-by-step (Windows & Mac)

```bash
cd TaskManagerExpo
npm install
npx expo start
```

> You can then open the app in:
> - **Expo Go** app on your phone (scan QR)
> - **Android Emulator** (requires Android Studio)
> - **iOS Simulator** (macOS only, Xcode required)
> - Web browser

> 💡 Modify code in `TaskManagerExpo/src` to begin development.

---

### 2. 🖥️ Backend – Flask API

#### ✅ Step-by-step (Windows)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### ✅ Step-by-step (Mac)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

> The backend will run on `http://localhost:5000` (unless specified otherwise).

Make sure to update `API_URL` in your frontend `config.js` file if needed.

---

## 🔄 Reset Frontend (Optional)

Want a clean slate?

```bash
cd TaskManagerExpo
npm run reset-project
```

This resets the `app/` directory and moves the example to `app-example/`.

---

## 📚 Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Hugging Face API](https://huggingface.co/inference-api)

---

## 💬 Community

- [Expo Discord](https://chat.expo.dev)
- [Expo GitHub](https://github.com/expo/expo)

