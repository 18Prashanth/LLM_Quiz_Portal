# AI Quiz Generator Portal

An intelligent examination portal that generates personalized quizzes from uploaded notes or syllabus files using AI (LLMs).  
Students upload their study material, choose quiz parameters, and receive a tailored quiz with analytics at the end!

---

## ✨ Features

- **AI Quiz Generation**: Create quizzes from uploaded syllabus or notes (PDF, DOCX, TXT, DOC) using an AI model (e.g., LLM via Groq API).
- **Custom Parameters**: Choose the number of questions and difficulty level.
- **Adaptive Quiz**: (Optional/Planned) Increase difficulty based on performance.
- **Live Quiz Experience**: One-question-at-a-time interface; next question shown after each answer.
- **User Feedback**: Mark confusing questions.
- **Quiz Analytics**: Score, accuracy, grade, and detailed answer review after completion.
- **Export Results**: Download quiz analysis as PDF or CSV.
- **Modern UI**: Clean, responsive interface.

---

## 🚀 Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: FastAPI (Python)
- **AI Model**: Groq API (DeepSeek)

---

## 🛠️ Setup & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-quiz-portal.git
cd ai-quiz-portal
```

### 2. Backend Setup

- Create & activate your virtual environment:

```
python -m venv venv
source venv/bin/activate  # Or: venv\Scripts\activate on Windows
```

- Install dependencies:

```
pip install -r requirements.txt
```

- Create a .env file and add your Groq API key:

```
GROQ_API_KEY=your-groq-api-key-here
```

- Run the backend:

```
uvicorn app.main:app --reload
```

### 3. Frontend Setup

Place your static files (index.html, styles.css, app.js) in the appropriate directory (e.g., static/).

Open index.html in your browser (or access via http://localhost:8000/ if served via FastAPI).

## 📖 Usage Flow

1. Upload Notes: Upload syllabus/notes (PDF, DOCX, TXT, etc.).

2. Configure Quiz: Select number of questions & difficulty.

3. Generate Quiz: Click "Generate Quiz" (AI creates questions).

4. Start Quiz: Answer each question (one at a time).

5. End Quiz: See results & analysis (score, accuracy, grade, detailed feedback).

## 🧩 Folder Structure

```
project-root/
├── app/
│   ├── main.py
│   ├── schemas.py
│   ├── router/
|   |     |_quiz_router.py
│   └── utils.py
├── static/
│   ├── styles.css
│   └── app.js
├──templates/
│   ├── index.html
├── requirements.txt
├── .env
└── README.md
```

## 📷 UI Preview

## ![App Screenshot](/img1.png)

## ![App Screenshot](/img2.png)

## ![App Screenshot](/img3.png)

## ![App Screenshot](/img4.png)

## ![App Screenshot](/img5.png)

## 👏 Acknowledgements

- Groq Cloud

- FastAPI

- And all open-source contributors!

## 💡 Author

Prashanth Gowda A S

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-blue?logo=linkedin)](https://www.linkedin.com/in/prashanthgowdaas/)
