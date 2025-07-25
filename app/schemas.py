from pydantic import BaseModel
from typing import List, Optional

class QuizParams(BaseModel):
    numQuestions: int
    difficulty: str

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]

class QuizAnswer(BaseModel):
    questionId: str
    question: str
    userAnswer: str

class QuizSubmission(BaseModel):
    answers: List[QuizAnswer]
