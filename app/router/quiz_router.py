from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from app import utils, schemas

router = APIRouter()

# In-memory state (keep things simple for now)
session_state = {}

@router.post("/upload_notes")
async def upload_notes(file: UploadFile = File(...)):
    text = await utils.extract_text(file)
    # Save text in memory with a session key (for demo, just one user)
    session_state['notes_text'] = text
    return {"success": True}

@router.post("/set_quiz_params")
async def set_quiz_params(params: schemas.QuizParams):
    session_state['quiz_params'] = params.dict()
    return {"success": True}

@router.post("/generate_quiz")
async def generate_quiz():
    notes = session_state.get('notes_text')
    params = session_state.get('quiz_params')
    if not notes or not params:
        raise HTTPException(status_code=400, detail="Missing notes or params")
    quiz = await utils.generate_quiz_questions(notes, params)
    session_state['quiz'] = quiz
    return {"questions": quiz['questions']}

@router.post("/submit_quiz")
async def submit_quiz(submission: schemas.QuizSubmission):
    quiz = session_state.get('quiz')
    if not quiz:
        raise HTTPException(status_code=400, detail="No quiz found")
    result = utils.grade_quiz(quiz, submission.answers)
    return result

@router.post("/question_feedback")
async def question_feedback(feedback: dict):
    # You can log, store, or process feedback here
    print("Received feedback:", feedback)
    return {"success": True, "msg": "Feedback received"}