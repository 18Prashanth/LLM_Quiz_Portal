import pdfplumber
import docx
import uuid
import os
import requests
import json
import re
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


def get_text_from_pdf(file):
    with pdfplumber.open(file.file) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

def get_text_from_docx(file):
    doc = docx.Document(file.file)
    return "\n".join([p.text for p in doc.paragraphs])

async def extract_text(file):
    ext = file.filename.split('.')[-1].lower()
    if ext == "pdf":
        return get_text_from_pdf(file)
    elif ext in ("doc", "docx"):
        return get_text_from_docx(file)
    else:
        # Assume text file
        return (await file.read()).decode('utf-8')

async def generate_quiz_questions(notes, params):
    n = params["numQuestions"]
    diff = params["difficulty"]

    prompt = (
        f"Generate {n} multiple-choice questions (with 4 options each) at {diff} difficulty "
        f"from the following notes/syllabus. Return as JSON:\n"
        f"[{{'id': str, 'question': str, 'options': [str, str, str, str], 'correct': str}} ...]\n\n"
        f"Notes:\n{notes[:3000]}"
    )

    api_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "deepseek-r1-distill-llama-70b",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1500
    }

    response = requests.post(api_url, headers=headers, json=data)
    if not response.ok:
        raise Exception("Groq API error: " + response.text)

    # Parse model response (may come as code block or plain JSON)
    content = response.json()["choices"][0]["message"]["content"]
    match = re.search(r"\[.*\]", content, re.DOTALL)
    questions = json.loads(match.group(0)) if match else []
    questions_for_user = [
        {"id": q.get("id") or str(uuid.uuid4()), "question": q["question"], "options": q["options"]}
        for q in questions
    ]
    quiz = {"questions": questions_for_user, "answers": {q.get("id") or str(uuid.uuid4()): q["correct"] for q in questions}}
    return quiz

def grade_quiz(quiz, user_answers):
    correct_answers = quiz["answers"]
    total = len(user_answers)
    correct = 0
    details = []
    for ua in user_answers:
        qid = ua.questionId
        user_ans = ua.userAnswer
        correct_ans = correct_answers.get(qid, None)
        is_correct = user_ans == correct_ans
        correct += is_correct
        details.append({
            "question": ua.question,
            "userAnswer": user_ans,
            "correctAnswer": correct_ans,
            "isCorrect": is_correct,
            "explanation": ""  # Could enhance with LLM
        })
    percent = round((correct / total) * 100) if total > 0 else 0
    grade = (
        "A" if percent >= 90 else
        "B" if percent >= 80 else
        "C" if percent >= 70 else
        "D" if percent >= 60 else "F"
    )
    return {
        "score": f"{correct}/{total}",
        "percentage": percent,
        "grade": grade,
        "detailedAnswers": details,
        "analysis": f"You scored {percent}%. Great job!" if percent >= 70 else f"You scored {percent}%. Keep practicing!"
    }
