from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from openai import OpenAI
import os
import json
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal, Score

# Create FASTAPI app
app = FastAPI()

# Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    # allow_origins=["http://localhost:3000"],  # Uncomment for specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request models
class TextRequest(BaseModel):
    text: str

class QuestionItem(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    user_answer: str 

class AnswerRequest(BaseModel):
    questions: list[QuestionItem]

# Initialize OpenAI client
load_dotenv()  
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# Endpoint to generate questions
@app.post("/generate-questions") 
async def generate_questions(request: TextRequest):
    try: 
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON generator. Always respond with only valid JSON. "
                                "No markdown formatting, explanations, or additional text. Just the raw JSON."
                },
                {
                    "role": "user",
                    "content": (
                        f"Based on the following Japanese text, generate 3 multiple-choice questions in only valid JSON format that test comprehension. "
                        f"Each should be in Japanese and have a 'question', 'options' (list of 4), and one correct 'correct_answer'. \n\n"
                        f"Text:\n{request.text}"
                    )
                }

            ], 
            max_tokens=800,
            temperature=0.7
            )
        questions_json_str = response.choices[0].message.content.strip()
        print(questions_json_str)
        # Ensure the response is valid JSON
        questions = json.loads(questions_json_str)
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to check answers
@app.post("/check-answers")  
async def check_answers(request: AnswerRequest, db: Session = Depends(get_db)):
    results = []
    correct_answers = 0
    for q in request.questions:
        results.append({
            "question": q.question,
            "user_answer": q.user_answer,
            "correct_answer": q.correct_answer,
            "is_correct": "Correct" if q.user_answer == q.correct_answer else "Incorrect"
        })
        if q.user_answer == q.correct_answer:
            correct_answers += 1

    # Save score to database
    score_entry = Score(
        username="test_user",  # Replace with actual user identification
        score=correct_answers,
        total_questions=len(request.questions)
    )
    db.add(score_entry)
    db.commit()
    db.refresh(score_entry)

    return {"results": results,
            "score": correct_answers,
            "total": len(request.questions)
    }

# Endpoint to get all scores
@app.get("/scores")
async def get_scores(db: Session = Depends(get_db)):
    scores = db.query(Score).all()
    return {"scores": [{"username": s.username, "score": s.score, "total_questions": s.total_questions} for s in scores]}
