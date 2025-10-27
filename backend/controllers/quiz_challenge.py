from agents.quiz_agent import generate_quiz, evaluate_quizzes_with_agent, quizzes_db
from schema.schemas import QuizRequest, EvaluationRequest
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from controllers.auth import get_current_user

def generate_quizes(request: QuizRequest,current_user):
    """Generate a new quiz and store it in memory."""
    try:
        quiz = generate_quiz(request)
        quizzes_db[quiz.quiz_id] = quiz
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

from config import engine
from sqlalchemy import text
import json
def evaluate_quiz(quiz_id: str, request: EvaluationRequest, current_user):
    """Evaluate answers for a specific quiz and store in database."""
    try:
        print(f"Evaluating quiz: {quiz_id} for user: {current_user}")
        
        if quiz_id not in quizzes_db:
            raise HTTPException(status_code=404, detail="Quiz not found")

        quiz = quizzes_db[quiz_id]
        answers = {}
        for k, v in request.answers.items():
            try:
                key_int = int(k)
                answers[key_int] = v
            except ValueError:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid answer key type: '{k}'. Keys must match Question.id as integers."
                )
        
        # Evaluate the quiz
        result = evaluate_quizzes_with_agent(quiz_id, answers)
        print(f"Quiz evaluation completed. Score: {result.score}")
        
        # Store quiz attempt in database
        with engine.begin() as conn:
            # Convert quiz data to JSON
            quiz_data = {
                "quiz_id": quiz.quiz_id,
                "title": quiz.title,
                "description": quiz.description,
                "questions": [q.dict() for q in quiz.questions],
                "time_limit": quiz.time_limit
            }
            
            evaluation_result = {
                "score": result.score,
                "correct_answers": result.correct_answers,
                "total_questions": result.total_questions,
                "feedback": result.feedback,
                "recommendation": result.recommendation
            }
            
            # Convert UUID to string for database storage
            user_id_str = str(current_user.id)
            print(f"Storing quiz attempt for user ID: {user_id_str}")
            
            # Insert into quiz_attempts table
            conn.execute(
                text("""
                    INSERT INTO public.quiz_attempts 
                    (user_id, quiz_id, quiz_data, user_answers, evaluation_result, score, correct_answers, total_questions)
                    VALUES (:user_id, :quiz_id, :quiz_data, :user_answers, :evaluation_result, :score, :correct_answers, :total_questions)
                """),
                {
                    "user_id": user_id_str,
                    "quiz_id": quiz_id,
                    "quiz_data": json.dumps(quiz_data),
                    "user_answers": json.dumps(answers),
                    "evaluation_result": json.dumps(evaluation_result),
                    "score": result.score,
                    "correct_answers": result.correct_answers,
                    "total_questions": result.total_questions
                }
            )
            
            print("Quiz attempt stored successfully")
            
            # Update user's profile to include this quiz ID
            profile_result = conn.execute(
                text("SELECT profile FROM public.users WHERE id = :user_id"),
                {"user_id": user_id_str}
            )
            user = profile_result.fetchone()
            
            if user:
                profile = user.profile if user.profile else {}
                print(f"Current user profile: {profile}")
                
                # Initialize quizzes_solved array if it doesn't exist
                if "quizzes_solved" not in profile:
                    profile["quizzes_solved"] = []
                
                # Add the quiz ID to quizzes_solved if not already present
                if quiz_id not in profile["quizzes_solved"]:
                    profile["quizzes_solved"].append(quiz_id)
                    print(f"Updated profile with quiz ID: {quiz_id}")
                    
                    # Update user profile
                    conn.execute(
                        text("UPDATE public.users SET profile = :profile WHERE id = :user_id"),
                        {
                            "profile": json.dumps(profile),
                            "user_id": user_id_str
                        }
                    )
                    print("User profile updated successfully")
                else:
                    print(f"Quiz ID {quiz_id} already in user profile")
            else:
                print("User not found in database")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in evaluate_quiz: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "message": "Failed to evaluate quiz",
                "error": str(e),
                "quiz_id": quiz_id
            }
        )