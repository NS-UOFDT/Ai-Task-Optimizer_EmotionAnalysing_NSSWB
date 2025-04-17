
# 🧠 AI-Powered Emotion-Based Task Optimizer

This project is a smart employee support system that detects user emotions using real-time input (text, face, or speech) and suggests tasks based on detected emotions. It includes role-based login for Admins and Employees, real-time emotion tracking while tasks are being done, and stress alert reports for Admins.

---

## 🌟 Features

### 🔐 Authentication
- Separate login for **Admin** and **Employees**
- Secure authentication system with user roles

### 📊 Dashboards
- **Admin Dashboard**: View employees, emotion alerts, task logs
- **Employee Dashboard**: See personalized task suggestions, mood history, task progress

### 🧠 Emotion Detection
- Uses a **custom-trained ML model** with **26 emotion labels**
- Integrates **pretrained models** for:
  - **Facial expression detection** (via webcam)
  - **Text emotion analysis**
  - *(Optional)* Speech emotion recognition
- Detects and tracks emotions **in real time**

### 📋 Task Recommendation
- Tasks are suggested dynamically based on current mood
- Data pulled from **Firebase Database**

### 🔴 Real-Time Monitoring & Alert System
- While performing a task, the system keeps tracking emotions
- If the system detects **stress**, **anger**, or **sadness**, it:
  - Captures current emotion, task, timestamp
  - Sends an **alert to Admin**
  - Helps identify burnout and disengagement early

### 📈 Emotion Analytics
- **History View**: Track how an employee feels over time
- **Team Analytics**: Admins can assess general team mood patterns

### 🔐 Data Privacy
- Emotion data is anonymized and securely stored
- Firebase used for authentication and real-time updates

---

## 🛠 Tech Stack

- **Frontend**: React.js (with Hooks + Context API)
- **Backend**: Firebase (Realtime DB, Auth)
- **ML Models**:
  - Custom model (trained on 26 emotion classes)
  - Pretrained models for face/text/speech analysis
  - TensorFlow.js / Python (for training)

---

## 🔧 Setup Instructions

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/emotion-task-optimizer.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase and add your config to `.env` or Firebase config file.
4. Start the app:
   ```bash
   npm start
   ```
5. Ensure the ML models (custom + pretrained) are integrated and running in your backend or served using TensorFlow.js.

---

## 🗂 Suggested Folder Structure

```
src/
├── components/
│   ├── Login.js
│   ├── AdminDashboard.js
│   ├── EmployeeDashboard.js
│   └── EmotionDetector.js
├── services/
│   ├── firebase.js
│   ├── taskService.js
│   └── emotionService.js
├── models/
│   └── customEmotionModel/     # Your trained emotion model
├── utils/
│   └── emotionUtils.js
├── App.js
└── index.js
```

---

## 📈 Emotion Labels (26 Classes Example)

```
happy, sad, angry, surprised, neutral, stressed, tired, excited,
anxious, bored, confident, frustrated, energetic, nervous, hopeful,
joyful, relaxed, lonely, scared, focused, overwhelmed, peaceful,
motivated, discouraged, thoughtful, confused
```

---

## 📬 Contact

For questions or collaboration:  
📧 your-email@example.com
