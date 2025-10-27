from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from schema.schemas import (
    SignupRequest, LoginRequest, ExplainationRequest, ExplainationResponse,
    ProblemRequest, SolutionRequest, QuizRequest, QuizResponse,
    EvaluationRequest, EvaluationResult
)
from controllers.auth import signup, login, get_current_user
from controllers.profile_details import get_profile,get_my_concepts,solved_problems
from controllers.concept_mastery import generate_explaination
from controllers.code_quest import generate_problems, unsave_problem_for_user,evaluate_solution,save_problem_for_user,get_problem_by_id
from controllers.quiz_challenge import generate_quizes, evaluate_quiz
from agents.testing_agent import test_agent
from config import engine, SessionLocal
from sqlalchemy import text
from dotenv import load_dotenv
import json
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("Server running on port 8000")
            print("Database Connected Successfully")
    except Exception as e:
        print("❌ Database connection failed:", e)


@app.post("/signup")
def signsup(user: SignupRequest):
    return signup(user)

@app.post("/login")
def logsin(user: LoginRequest):
    return login(user)


@app.post("/api/generate-explaination", response_model=ExplainationResponse)
def explains_concept(request: ExplainationRequest, current_user=Depends(get_current_user)):
    return generate_explaination(request, current_user)


@app.get("/api/profile")
def getprofile(user=Depends(get_current_user)):
    return get_profile(user)


@app.get("/api/my-concepts")
def get_user_concepts(user=Depends(get_current_user)):
    return get_my_concepts(user)


@app.post("/api/generate-problems")
def get_problems(request: ProblemRequest, user=Depends(get_current_user)):
    return generate_problems(request, user)


@app.post("/api/evaluate-solution")
def evaluate_the_solution(request: SolutionRequest, user=Depends(get_current_user)):
    return evaluate_solution(request, user)


@app.post("/api/run-tests")
def run_tests_on_problem(request: SolutionRequest, user=Depends(get_current_user)):
    return test_agent(request, user)

@app.post("/api/generate-quizzes", response_model=QuizResponse)
def generates_quizzes(request: QuizRequest, user=Depends(get_current_user)):
    return generate_quizes(request, user)

@app.post("/api/evaluate-quiz/{quiz_id}", response_model=EvaluationResult)
def evaluates_quiz(quiz_id: str, request: EvaluationRequest, user=Depends(get_current_user)):
    return evaluate_quiz(quiz_id, request, user)

@app.post("/api/save-problem/{problem_id}")
def save_problem(problem_id:str,current_user=Depends(get_current_user)):
    return save_problem_for_user(problem_id,current_user)

@app.get("/api/problem/{problem_id}")
def get_problem(problem_id:str,current_user=Depends(get_current_user)):
    return get_problem_by_id(problem_id)

@app.delete("/api/unsave-problem/{problem_id}")
def unsave_problem(problem_id:str,current_user=Depends(get_current_user)):
    return unsave_problem_for_user(problem_id,current_user)

@app.get("/api/solved-problems")
def get_solved_problems(current_user=Depends(get_current_user)):
    return solved_problems(current_user)



from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from controllers.auth import get_current_user
import os, base64
from dotenv import load_dotenv

# 🔑 Load environment variables and configure Gemini
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))



# 🤖 AI Mentor API
@app.post("/api/mentor/solve-doubt")
async def mentor_solve_doubt(
    query: str = Form(...),
    image: UploadFile = File(None),
    file: UploadFile = File(None),
    current_user=Depends(get_current_user)
):
    """
    🧠 AI Mentor:
    Helps user understand and fix coding or conceptual doubts.
    - Accepts: text, image, or file
    - Guides the user to reach the solution
    - Explains mistakes or provides hints
    """

    try:
        # ✅ Initialize Gemini Model
        model = genai.GenerativeModel("models/gemini-2.5-pro")

        # 🎯 Build Input Message
        parts = [
            {"text": (
                "You are an AI mentor that helps users debug, reason, and understand "
                "their problems step-by-step. "

                "If the issue is too complex or user explicitly requests, give the final answer too. "
                "Explain using simple, beginner-friendly language.\n\n"
                f"User's doubt: {query}"
            )}
        ]

        # 🖼️ Handle image upload
        if image:
            image_content = await image.read()
            parts.append({
                "inline_data": {
                    "mime_type": image.content_type,
                    "data": base64.b64encode(image_content).decode("utf-8")
                }
            })

        # 📄 Handle file upload
        elif file:
            file_content = await file.read()
            parts.append({
                "inline_data": {
                    "mime_type": file.content_type,
                    "data": base64.b64encode(file_content).decode("utf-8")
                }
            })

        # ⚡ Generate mentor response
        response = model.generate_content(parts)

        mentor_reply = response.text or "No response generated by Mentor AI."

        return {
            "mentor_message": mentor_reply,
            "user": current_user.email,
            "mode": "mentor-guided"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mentor AI Error: {str(e)}")



from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json, logging
from controllers.groq_setup import query_groq
from langchain_community.utilities import GoogleSerperAPIWrapper, WikipediaAPIWrapper, ArxivAPIWrapper
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.tools import Tool
import os
from dotenv import load_dotenv

load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

# Initialize Groq LLM
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0,
)

# Initialize tools
serper = GoogleSerperAPIWrapper()
wikipedia = WikipediaAPIWrapper()
arxiv = ArxivAPIWrapper()

tools = [
    Tool("Google_Serper_Search", func=serper.run, description="Web search"),
    Tool("Wikipedia_Search", func=wikipedia.run, description="Wikipedia summary"),
    Tool("Arxiv_Search", func=arxiv.run, description="Academic papers"),
]

agent = create_react_agent(llm, tools)

# ------------------------------
# Request Schema
# ------------------------------
class LearningPathRequest(BaseModel):
    topic: str
    subtopics: Optional[List[str]] = []
    level: Optional[str] = "Beginner"

# ------------------------------
# Helper: Fetch concept resources
# ------------------------------
import re

def fetch_dsa_resources(concept: str):
    """
    Fetch DSA-related articles and YouTube videos for a concept.
    Ensures links are relevant to data structures and algorithms.
    """
    image_url = None
    sources = []

    try:
        # Image search
        image_results = serper.results(f"{concept} DSA tutorial", type="images")
        if "images" in image_results and len(image_results["images"]) > 0:
            image_url = image_results["images"][0].get("imageUrl")

        # Web search - add keywords to constrain to DSA
        text_results = serper.results(f"{concept} data structures algorithms tutorial")
        if "organic" in text_results:
            for item in text_results["organic"][:5]:
                link = item.get("link")
                title = item.get("title")
                # Filter out StackOverflow or unrelated sites
                if re.search(r"(leetcode|geeksforgeeks|codeforces|codechef|csdojo|tutorial)", link, re.I):
                    sources.append({"title": title, "link": link})

        # YouTube search
        youtube_results = serper.results(f"site:youtube.com {concept} DSA tutorial")
        if "organic" in youtube_results:
            for item in youtube_results["organic"][:5]:
                link = item.get("link")
                title = item.get("title")
                if "youtube.com/watch" in link:
                    # Optionally filter for DSA content keywords
                    if re.search(r"(DSA|data structures|algorithms|coding|leetcode|geeksforgeeks)", title, re.I):
                        sources.append({"title": title, "link": link})

    except Exception as e:
        logging.error(f"Error fetching DSA resources for {concept}: {str(e)}")

    return image_url, sources

import uuid
from typing import Dict,Any
class LearningPathResponse(BaseModel):
    id: str
    topic: str
    level: str
    image_url: Optional[str]
    sources: Optional[List[Dict[str, str]]]
    learning_plan: Dict[str, Any]
    created_at: str
@app.post("/api/mentor/learning-path")
def generate_topic_learning_path(payload: LearningPathRequest, current_user = Depends(get_current_user)):
    try:
        topic = payload.topic
        subtopics = payload.subtopics or []
        level = payload.level

        if not topic:
            raise HTTPException(status_code=400, detail="Topic is required")

        # Fetch resources for main topic
        image_url, sources = fetch_dsa_resources(topic)

        # Prepare Groq prompt - be more specific about JSON format
        prompt = f"""
        You are an expert DSA Mentor AI. Create a detailed, day-wise learning path for the following:

        Topic: {topic}
        Subtopics: {', '.join(subtopics) if subtopics else 'N/A'}
        Level: {level}

        Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
        {{
          "overview": "Brief introduction and importance",
          "objectives": ["objective1", "objective2", ...],
          "recommended_resources": [
            {{"type": "video", "title": "Resource Title", "url": "https://..."}},
            {{"type": "article", "title": "Resource Title", "url": "https://..."}}
          ],
          "day_wise_plan": [
            {{
              "day": 1,
              "focus": "Topic focus",
              "subtopics": ["subtopic1", "subtopic2"],
              "explanation": "Why this is important",
              "practice": ["exercise1", "exercise2"]
            }}
          ],
          "problems_to_strengthen_concepts": [
            {{
              "title": "Problem Title",
              "platform": "LeetCode",
              "url": "https://...",
              "concept": "Related concept"
            }}
          ],
          "final_assessment": "Assessment description"
        }}

        Important: Return ONLY the JSON object, no additional text or code blocks.
        """

        # Query Groq model
        response_text = query_groq(prompt)

        # Clean and parse the response
        learning_plan = parse_groq_response(response_text)

        # Generate unique ID for the learning path
        learning_path_id = str(uuid.uuid4())

        # Store learning path in database
        with engine.begin() as conn:
            # Insert into learning_paths table
            conn.execute(
                text("""
                    INSERT INTO public.learning_paths 
                    (id, user_id, topic, level, image_url, sources, learning_plan)
                    VALUES (:id, :user_id, :topic, :level, :image_url, :sources, :learning_plan)
                """),
                {
                    "id": learning_path_id,
                    "user_id": current_user.id,
                    "topic": topic,
                    "level": level,
                    "image_url": image_url,
                    "sources": json.dumps(sources) if sources else None,
                    "learning_plan": json.dumps(learning_plan)
                }
            )

            # Update user's profile to include this learning path ID
            profile = current_user.profile if current_user.profile else {}
            learning_paths_list = profile.get("learning_paths", [])
            
            # Add the new learning path ID to the list if not already present
            if learning_path_id not in learning_paths_list:
                learning_paths_list.append(learning_path_id)
                profile["learning_paths"] = learning_paths_list
                
                # Update user profile
                conn.execute(
                    text("UPDATE public.users SET profile = :profile WHERE id = :user_id"),
                    {
                        "profile": json.dumps(profile),
                        "user_id": current_user.id
                    }
                )

        return {
            "id": learning_path_id,
            "topic": topic,
            "level": level,
            "image_url": image_url,
            "sources": sources,
            "learning_plan": learning_plan,
            "message": "Learning path generated and saved successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Learning Path Error: {str(e)}")

def parse_groq_response(response_text: str) -> dict:
    """
    Parse Groq response to extract JSON, handling code blocks and malformed JSON.
    """
    try:
        # First try direct JSON parsing
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            # Try to extract JSON from code blocks
            json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            else:
                # Try to find JSON object in the text
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx != 0:
                    json_str = response_text[start_idx:end_idx]
                    return json.loads(json_str)
                else:
                    # Fallback: return as overview
                    return {"overview": response_text}
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON response: {e}")
            logging.error(f"Response text: {response_text}")
            return {"overview": response_text}









# Add these imports at the top of your main.py
from sqlalchemy import text
import json
from typing import List, Dict, Any

# Quiz Attempts API Endpoints
@app.get("/api/quiz/attempts")
def get_user_quiz_attempts(current_user=Depends(get_current_user)):
    """Get all quiz attempts for the current user."""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT id, user_id, quiz_id, quiz_data, user_answers, 
                           evaluation_result, score, correct_answers, total_questions, 
                           attempted_at
                    FROM public.quiz_attempts 
                    WHERE user_id = :user_id
                    ORDER BY attempted_at DESC
                """),
                {"user_id": current_user.id}
            )
            
            attempts = []
            for row in result:
                # Parse JSON fields
                quiz_data = row.quiz_data if row.quiz_data else {}
                user_answers = row.user_answers if row.user_answers else {}
                evaluation_result = row.evaluation_result if row.evaluation_result else {}
                
                attempts.append({
                    "id": str(row.id),
                    "user_id": str(row.user_id),
                    "quiz_id": row.quiz_id,
                    "quiz_data": quiz_data,
                    "user_answers": user_answers,
                    "evaluation_result": evaluation_result,
                    "score": float(row.score),
                    "correct_answers": row.correct_answers,
                    "total_questions": row.total_questions,
                    "attempted_at": row.attempted_at.isoformat() if row.attempted_at else None
                })
            
            return {
                "user_id": str(current_user.id),
                "total_attempts": len(attempts),
                "attempts": attempts
            }
    
    except Exception as e:
        logging.error(f"Error fetching quiz attempts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching quiz attempts: {str(e)}")

@app.get("/api/quiz/attempts/{attempt_id}")
def get_quiz_attempt_details(attempt_id: str, current_user=Depends(get_current_user)):
    """Get detailed information about a specific quiz attempt."""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT id, user_id, quiz_id, quiz_data, user_answers, 
                           evaluation_result, score, correct_answers, total_questions, 
                           attempted_at
                    FROM public.quiz_attempts 
                    WHERE id = :id AND user_id = :user_id
                """),
                {
                    "id": attempt_id,
                    "user_id": current_user.id
                }
            )
            
            attempt = result.fetchone()
            if not attempt:
                raise HTTPException(status_code=404, detail="Quiz attempt not found")
            
            # Parse JSON fields
            quiz_data = attempt.quiz_data if attempt.quiz_data else {}
            user_answers = attempt.user_answers if attempt.user_answers else {}
            evaluation_result = attempt.evaluation_result if attempt.evaluation_result else {}
            
            return {
                "id": str(attempt.id),
                "user_id": str(attempt.user_id),
                "quiz_id": attempt.quiz_id,
                "quiz_data": quiz_data,
                "user_answers": user_answers,
                "evaluation_result": evaluation_result,
                "score": float(attempt.score),
                "correct_answers": attempt.correct_answers,
                "total_questions": attempt.total_questions,
                "attempted_at": attempt.attempted_at.isoformat() if attempt.attempted_at else None
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching quiz attempt details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching quiz attempt details: {str(e)}")

@app.get("/api/quiz/statistics")
def get_user_quiz_statistics(current_user=Depends(get_current_user)):
    """Get quiz statistics for the current user."""
    try:
        with engine.connect() as conn:
            # Get basic statistics from quiz_attempts table
            result = conn.execute(
                text("""
                    SELECT 
                        COUNT(*) as total_attempts,
                        AVG(score) as average_score,
                        MAX(score) as best_score,
                        MIN(score) as worst_score,
                        SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END) as passed_quizzes
                    FROM public.quiz_attempts 
                    WHERE user_id = :user_id
                """),
                {"user_id": current_user.id}
            )
            
            stats = result.fetchone()
            
            # Get recent attempts
            recent_result = conn.execute(
                text("""
                    SELECT quiz_id, score, attempted_at
                    FROM public.quiz_attempts 
                    WHERE user_id = :user_id
                    ORDER BY attempted_at DESC
                    LIMIT 5
                """),
                {"user_id": current_user.id}
            )
            
            recent_attempts = []
            for row in recent_result:
                recent_attempts.append({
                    "quiz_id": row.quiz_id,
                    "score": float(row.score),
                    "attempted_at": row.attempted_at.isoformat() if row.attempted_at else None
                })
            
            return {
                "user_id": str(current_user.id),
                "statistics": {
                    "total_attempts": stats.total_attempts or 0,
                    "average_score": round(float(stats.average_score or 0), 2),
                    "best_score": round(float(stats.best_score or 0), 2),
                    "worst_score": round(float(stats.worst_score or 0), 2),
                    "passed_quizzes": stats.passed_quizzes or 0,
                    "success_rate": round((stats.passed_quizzes or 0) / (stats.total_attempts or 1) * 100, 2) if stats.total_attempts else 0
                },
                "recent_attempts": recent_attempts
            }
    
    except Exception as e:
        logging.error(f"Error fetching quiz statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching quiz statistics: {str(e)}")

@app.delete("/api/quiz/attempts/{attempt_id}")
def delete_quiz_attempt(attempt_id: str, current_user=Depends(get_current_user)):
    """Delete a specific quiz attempt."""
    try:
        with engine.begin() as conn:
            # First check if the attempt exists and belongs to the user
            result = conn.execute(
                text("SELECT id FROM public.quiz_attempts WHERE id = :id AND user_id = :user_id"),
                {
                    "id": attempt_id,
                    "user_id": current_user.id
                }
            )
            
            if not result.fetchone():
                raise HTTPException(status_code=404, detail="Quiz attempt not found")
            
            # Delete the attempt
            conn.execute(
                text("DELETE FROM public.quiz_attempts WHERE id = :id AND user_id = :user_id"),
                {
                    "id": attempt_id,
                    "user_id": current_user.id
                }
            )
            
            return {"message": "Quiz attempt deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting quiz attempt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting quiz attempt: {str(e)}")







# Add these imports at the top if not already present
from sqlalchemy import text
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid

# Learning Path Models
class LearningPathRequest(BaseModel):
    topic: str
    subtopics: Optional[List[str]] = []
    level: Optional[str] = "Beginner"

class LearningPathResponse(BaseModel):
    id: str
    topic: str
    level: str
    image_url: Optional[str]
    sources: Optional[List[Dict[str, str]]]
    learning_plan: Dict[str, Any]
    created_at: str

# Learning Path API Endpoints
@app.get("/api/learning-paths")
def get_user_learning_paths(current_user=Depends(get_current_user)):
    """Get all learning paths for the current user."""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT id, topic, level, image_url, sources, learning_plan, created_at
                    FROM public.learning_paths 
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                """),
                {"user_id": current_user.id}
            )
            
            learning_paths = []
            for row in result:
                # Parse JSON fields
                sources = row.sources if row.sources else []
                learning_plan = row.learning_plan if row.learning_plan else {}
                
                learning_paths.append({
                    "id": str(row.id),
                    "topic": row.topic,
                    "level": row.level,
                    "image_url": row.image_url,
                    "sources": sources,
                    "learning_plan": learning_plan,
                    "created_at": row.created_at.isoformat() if row.created_at else None
                })
            
            return {
                "user_id": str(current_user.id),
                "total_paths": len(learning_paths),
                "learning_paths": learning_paths
            }
    
    except Exception as e:
        logging.error(f"Error fetching learning paths: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching learning paths: {str(e)}")

@app.get("/api/learning-paths/{path_id}")
def get_learning_path_details(path_id: str, current_user=Depends(get_current_user)):
    """Get detailed information about a specific learning path."""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT id, topic, level, image_url, sources, learning_plan, created_at
                    FROM public.learning_paths 
                    WHERE id = :id AND user_id = :user_id
                """),
                {
                    "id": path_id,
                    "user_id": current_user.id
                }
            )
            
            path = result.fetchone()
            if not path:
                raise HTTPException(status_code=404, detail="Learning path not found")
            
            # Parse JSON fields
            sources = path.sources if path.sources else []
            learning_plan = path.learning_plan if path.learning_plan else {}
            
            return {
                "id": str(path.id),
                "topic": path.topic,
                "level": path.level,
                "image_url": path.image_url,
                "sources": sources,
                "learning_plan": learning_plan,
                "created_at": path.created_at.isoformat() if path.created_at else None
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching learning path details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching learning path details: {str(e)}")

@app.delete("/api/learning-paths/{path_id}")
def delete_learning_path(path_id: str, current_user=Depends(get_current_user)):
    """Delete a specific learning path."""
    try:
        with engine.begin() as conn:
            # First check if the path exists and belongs to the user
            result = conn.execute(
                text("SELECT id FROM public.learning_paths WHERE id = :id AND user_id = :user_id"),
                {
                    "id": path_id,
                    "user_id": current_user.id
                }
            )
            
            if not result.fetchone():
                raise HTTPException(status_code=404, detail="Learning path not found")
            
            # Delete the learning path
            conn.execute(
                text("DELETE FROM public.learning_paths WHERE id = :id AND user_id = :user_id"),
                {
                    "id": path_id,
                    "user_id": current_user.id
                }
            )
            
            # Remove from user's profile
            profile_result = conn.execute(
                text("SELECT profile FROM public.users WHERE id = :user_id"),
                {"user_id": current_user.id}
            )
            
            user_profile = profile_result.fetchone()
            if user_profile and user_profile.profile:
                profile_data = user_profile.profile
                learning_paths_list = profile_data.get("learning_paths", [])
                
                if path_id in learning_paths_list:
                    learning_paths_list.remove(path_id)
                    profile_data["learning_paths"] = learning_paths_list
                    
                    conn.execute(
                        text("UPDATE public.users SET profile = :profile WHERE id = :user_id"),
                        {
                            "profile": json.dumps(profile_data),
                            "user_id": current_user.id
                        }
                    )
            
            return {"message": "Learning path deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting learning path: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting learning path: {str(e)}")