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






# Add this to your main.py file
from datetime import datetime
# FastAPI and Web Framework
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# Database and ORM
from sqlalchemy import text
from config import engine, SessionLocal

# Authentication
from controllers.auth import get_current_user

# Data Models
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Union

# Utilities
import json
import logging
import uuid
import os
from datetime import datetime, timedelta

# Environment
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
# Dashboard Models
class DashboardStats(BaseModel):
    user_stats: Dict[str, Any]
    learning_stats: Dict[str, Any]
    problem_stats: Dict[str, Any]
    quiz_stats: Dict[str, Any]
    recent_activity: List[Dict[str, Any]]
    progress_overview: Dict[str, Any]

# Dashboard API Endpoints
@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(current_user=Depends(get_current_user)):
    """Get comprehensive dashboard statistics for the current user."""
    try:
        with engine.connect() as conn:
            user_id = current_user.id
            
            # 1. User Basic Stats
            user_stats_result = conn.execute(
                text("""
                    SELECT name, email, profilephoto, level, profile
                    FROM public.users 
                    WHERE id = :user_id
                """),
                {"user_id": user_id}
            )
            user_data = user_stats_result.fetchone()
            
            user_profile = user_data.profile if user_data.profile else {}
            
            # 2. Learning Stats
            # Concepts learned
            concepts_result = conn.execute(
                text("""
                    SELECT COUNT(*) as total_concepts
                    FROM public.dsa_explanations 
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            )
            total_concepts = concepts_result.fetchone().total_concepts or 0
            
            # Learning paths
            paths_result = conn.execute(
                text("""
                    SELECT COUNT(*) as total_paths
                    FROM public.learning_paths 
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            )
            total_paths = paths_result.fetchone().total_paths or 0
            
            # 3. Problem Stats
            # Solved problems
            solved_result = conn.execute(
                text("""
                    SELECT COUNT(*) as solved_count,
                           COUNT(DISTINCT difficulty) as difficulty_count,
                           AVG(CASE WHEN difficulty = 'easy' THEN 1 WHEN difficulty = 'medium' THEN 2 WHEN difficulty = 'hard' THEN 3 ELSE 0 END) as avg_difficulty_level
                    FROM public.user_solved_problems 
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            )
            solved_data = solved_result.fetchone()
            solved_count = solved_data.solved_count or 0
            difficulty_count = solved_data.difficulty_count or 0
            avg_difficulty_level = float(solved_data.avg_difficulty_level or 0)
            
            # Saved problems count from user profile
            saved_problems_count = len(user_profile.get('saved_problems', []))
            
            # Problem difficulty distribution
            difficulty_result = conn.execute(
                text("""
                    SELECT difficulty, COUNT(*) as count
                    FROM public.user_solved_problems 
                    WHERE user_id = :user_id
                    GROUP BY difficulty
                """),
                {"user_id": user_id}
            )
            
            difficulty_distribution = {}
            total_solved = 0
            for row in difficulty_result:
                difficulty_distribution[row.difficulty] = row.count
                total_solved += row.count
            
            # Calculate percentages
            for difficulty in difficulty_distribution:
                if total_solved > 0:
                    difficulty_distribution[difficulty] = {
                        'count': difficulty_distribution[difficulty],
                        'percentage': round((difficulty_distribution[difficulty] / total_solved) * 100, 1)
                    }
            
            # 4. Quiz Stats
            quiz_result = conn.execute(
                text("""
                    SELECT COUNT(*) as total_attempts,
                           AVG(score) as average_score,
                           MAX(score) as best_score,
                           MIN(score) as worst_score,
                           SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END) as passed_quizzes,
                           COUNT(DISTINCT quiz_id) as unique_quizzes
                    FROM public.quiz_attempts 
                    WHERE user_id = :user_id
                """),
                {"user_id": user_id}
            )
            quiz_data = quiz_result.fetchone()
            
            total_attempts = quiz_data.total_attempts or 0
            average_score = round(float(quiz_data.average_score or 0), 1)
            best_score = round(float(quiz_data.best_score or 0), 1)
            worst_score = round(float(quiz_data.worst_score or 0), 1)
            passed_quizzes = quiz_data.passed_quizzes or 0
            unique_quizzes = quiz_data.unique_quizzes or 0
            
            # Quiz score distribution
            score_distribution_result = conn.execute(
                text("""
                    SELECT 
                        CASE 
                            WHEN score >= 90 THEN '90-100'
                            WHEN score >= 80 THEN '80-89'
                            WHEN score >= 70 THEN '70-79'
                            WHEN score >= 60 THEN '60-69'
                            ELSE '0-59'
                        END as score_range,
                        COUNT(*) as count
                    FROM public.quiz_attempts 
                    WHERE user_id = :user_id
                    GROUP BY score_range
                    ORDER BY score_range
                """),
                {"user_id": user_id}
            )
            
            score_distribution = {}
            for row in score_distribution_result:
                score_distribution[row.score_range] = row.count
            
            # 5. Recent Activity (last 7 days)
            recent_activity_result = conn.execute(
                text("""
                    (
                        SELECT 
                            'concept' as type,
                            title,
                            created_at,
                            'Learned new concept: ' || title as description
                        FROM public.dsa_explanations 
                        WHERE user_id = :user_id AND created_at >= NOW() - INTERVAL '7 days'
                    )
                    UNION ALL
                    (
                        SELECT 
                            'problem' as type,
                            title,
                            solved_at as created_at,
                            'Solved problem: ' || title as description
                        FROM public.user_solved_problems 
                        WHERE user_id = :user_id AND solved_at >= NOW() - INTERVAL '7 days'
                    )
                    UNION ALL
                    (
                        SELECT 
                            'quiz' as type,
                            quiz_id as title,
                            attempted_at as created_at,
                            'Completed quiz with score: ' || score::text || '%' as description
                        FROM public.quiz_attempts 
                        WHERE user_id = :user_id AND attempted_at >= NOW() - INTERVAL '7 days'
                    )
                    UNION ALL
                    (
                        SELECT 
                            'learning_path' as type,
                            topic as title,
                            created_at,
                            'Started learning path: ' || topic as description
                        FROM public.learning_paths 
                        WHERE user_id = :user_id AND created_at >= NOW() - INTERVAL '7 days'
                    )
                    ORDER BY created_at DESC
                    LIMIT 10
                """),
                {"user_id": user_id}
            )
            
            recent_activity = []
            for row in recent_activity_result:
                recent_activity.append({
                    "type": row.type,
                    "title": row.title,
                    "description": row.description,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "timestamp": row.created_at.isoformat() if row.created_at else None
                })
            
            # 6. Progress Overview (last 30 days)
            progress_result = conn.execute(
                text("""
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as daily_activity
                    FROM (
                        SELECT created_at FROM public.dsa_explanations WHERE user_id = :user_id AND created_at >= NOW() - INTERVAL '30 days'
                        UNION ALL
                        SELECT solved_at as created_at FROM public.user_solved_problems WHERE user_id = :user_id AND solved_at >= NOW() - INTERVAL '30 days'
                        UNION ALL
                        SELECT attempted_at as created_at FROM public.quiz_attempts WHERE user_id = :user_id AND attempted_at >= NOW() - INTERVAL '30 days'
                        UNION ALL
                        SELECT created_at FROM public.learning_paths WHERE user_id = :user_id AND created_at >= NOW() - INTERVAL '30 days'
                    ) AS all_activities
                    GROUP BY DATE(created_at)
                    ORDER BY date
                """),
                {"user_id": user_id}
            )
            
            progress_data = []
            for row in progress_result:
                progress_data.append({
                    "date": row.date.isoformat(),
                    "activity": row.daily_activity
                })
            
            # Calculate streaks and consistency
            current_streak = 0
            max_streak = 0
            temp_streak = 0
            today = datetime.now().date()
            yesterday = today - timedelta(days=1)
            
            for i in range(len(progress_data)):
                activity_date = datetime.fromisoformat(progress_data[i]['date']).date()
                if activity_date == today or activity_date == yesterday:
                    current_streak += 1
                temp_streak += 1
                if i == len(progress_data) - 1 or datetime.fromisoformat(progress_data[i+1]['date']).date() != activity_date - timedelta(days=1):
                    max_streak = max(max_streak, temp_streak)
                    temp_streak = 0
            
            # 7. Skill Level Assessment
            skill_level = "Beginner"
            total_points = (solved_count * 10) + (total_concepts * 5) + (average_score * 2) + (total_attempts * 3)
            
            if total_points > 500:
                skill_level = "Advanced"
            elif total_points > 200:
                skill_level = "Intermediate"
            elif total_points > 50:
                skill_level = "Beginner+"
            
            # Compile all statistics
            dashboard_stats = {
                "user_stats": {
                    "name": user_data.name,
                    "email": user_data.email,
                    "profilephoto": user_data.profilephoto,
                    "level": user_data.level,
                    "skill_level": skill_level,
                    "total_points": total_points,
                    "member_since": user_data.created_at.isoformat() if hasattr(user_data, 'created_at') and user_data.created_at else None
                },
                "learning_stats": {
                    "total_concepts": total_concepts,
                    "total_learning_paths": total_paths,
                    "current_streak": current_streak,
                    "max_streak": max_streak,
                    "consistency_rate": round((len(progress_data) / 30) * 100, 1) if progress_data else 0
                },
                "problem_stats": {
                    "solved_count": solved_count,
                    "saved_count": saved_problems_count,
                    "difficulty_distribution": difficulty_distribution,
                    "avg_difficulty_level": avg_difficulty_level,
                    "difficulty_count": difficulty_count,
                    "success_rate": round((solved_count / (solved_count + 10)) * 100, 1) if solved_count > 0 else 0  # Mock success rate
                },
                "quiz_stats": {
                    "total_attempts": total_attempts,
                    "average_score": average_score,
                    "best_score": best_score,
                    "worst_score": worst_score,
                    "passed_quizzes": passed_quizzes,
                    "unique_quizzes": unique_quizzes,
                    "success_rate": round((passed_quizzes / total_attempts) * 100, 1) if total_attempts > 0 else 0,
                    "score_distribution": score_distribution
                },
                "recent_activity": recent_activity,
                "progress_overview": {
                    "daily_activity": progress_data,
                    "total_activities": len(progress_data),
                    "current_streak": current_streak,
                    "max_streak": max_streak
                }
            }
            
            return dashboard_stats
    
    except Exception as e:
        logging.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard statistics: {str(e)}")




# Add these imports at the top
# Add these imports at the top
import subprocess
import tempfile
import os
import sys
import docker
import time
import random
from config import client
from config import GROQ_MODEL
# Enhanced Contest Models
class ContestProblem(BaseModel):
    id: str
    title: str
    difficulty: str
    description: str
    examples: List[Dict[str, str]]
    constraints: List[str]
    starter_code: str
    test_cases: List[Dict[str, str]]
    points: int
    tags: List[str]
    function_name: str

class ContestSubmission(BaseModel):
    problem_id: str
    code: str
    language: str

class SubmissionResult(BaseModel):
    submission_id: str
    problem_id: str
    user_id: str
    code: str
    language: str
    status: str
    execution_time: float
    memory_used: float
    test_cases_passed: int
    total_test_cases: int
    score: int
    submitted_at: str
    results: List[Dict]

# Enhanced problem generation with better structure
@app.post("/api/contest/generate-daily-problems")
def generate_daily_contest_problems(current_user=Depends(get_current_user)):
    """Generate 5 daily contest problems when requested"""
    try:
        today = datetime.now().date()
        
        with engine.begin() as conn:
            # Delete existing problems for today
            conn.execute(
                text("DELETE FROM public.contest_problems WHERE date(created_at) = :today"),
                {"today": today}
            )
            
            difficulties = ["easy", "medium", "hard"]
            data_structures = ["array", "string", "linked_list", "tree", "graph", "dynamic_programming", "sorting"]
            
            problems = []
            for i in range(5):
                difficulty = random.choice(difficulties)
                ds = random.choice(data_structures)
                
                try:
                    # Generate problem using AI
                    prompt = f"""
                    Create a {difficulty} level coding problem about {ds} with this EXACT JSON structure:
                    {{
                        "title": "Problem Title",
                        "description": "Detailed problem description",
                        "examples": [
                            {{
                                "input": "input1",
                                "expected_output": "output1", 
                                "explanation": "explanation1"
                            }}
                        ],
                        "constraints": ["constraint1", "constraint2"],
                        "starter_code": "def solution(input):\\n    # Your code here\\n    return result",
                        "test_cases": [
                            {{
                                "input": "test_input1",
                                "expected_output": "expected_output1"
                            }}
                        ],
                        "points": {100 if difficulty == 'easy' else 200 if difficulty == 'medium' else 300},
                        "tags": ["{ds}", "{difficulty}"],
                        "function_name": "solution"
                    }}

                    Make sure the function_name matches the function in starter_code.
                    Return valid JSON only.
                    """
                    
                    response = client.chat.completions.create(
                        model=GROQ_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7
                    )
                    
                    # Clean the response and parse JSON
                    response_text = response.choices[0].message.content
                    response_text = response_text.strip()
                    if response_text.startswith("```json"):
                        response_text = response_text[7:]
                    if response_text.endswith("```"):
                        response_text = response_text[:-3]
                    response_text = response_text.strip()
                    
                    problem_data = json.loads(response_text)
                    
                except Exception as e:
                    logging.error(f"Error generating AI problem {i+1}: {str(e)}")
                    # Use fallback problem
                    problem_data = create_fallback_problem_data(i, ds, difficulty)
                
                # Insert into database
                problem_id = str(uuid.uuid4())
                
                # Check if function_name column exists and handle accordingly
                try:
                    conn.execute(
                        text("""
                            INSERT INTO public.contest_problems 
                            (id, title, difficulty, description, examples, constraints, 
                             starter_code, test_cases, points, tags, function_name, created_at)
                            VALUES (:id, :title, :difficulty, :description, :examples, :constraints,
                                   :starter_code, :test_cases, :points, :tags, :function_name, :created_at)
                        """),
                        {
                            "id": problem_id,
                            "title": problem_data.get("title", f"Daily Problem {i+1}"),
                            "difficulty": difficulty,
                            "description": problem_data.get("description", ""),
                            "examples": json.dumps(problem_data.get("examples", [])),
                            "constraints": json.dumps(problem_data.get("constraints", [])),
                            "starter_code": problem_data.get("starter_code", ""),
                            "test_cases": json.dumps(problem_data.get("test_cases", [])),
                            "points": problem_data.get("points", 100),
                            "tags": json.dumps(problem_data.get("tags", [ds, difficulty])),
                            "function_name": problem_data.get("function_name", "solution"),
                            "created_at": datetime.now()
                        }
                    )
                except Exception as db_error:
                    logging.error(f"Database error, trying without function_name: {str(db_error)}")
                    # Try without function_name column
                    conn.execute(
                        text("""
                            INSERT INTO public.contest_problems 
                            (id, title, difficulty, description, examples, constraints, 
                             starter_code, test_cases, points, tags, created_at)
                            VALUES (:id, :title, :difficulty, :description, :examples, :constraints,
                                   :starter_code, :test_cases, :points, :tags, :created_at)
                        """),
                        {
                            "id": problem_id,
                            "title": problem_data.get("title", f"Daily Problem {i+1}"),
                            "difficulty": difficulty,
                            "description": problem_data.get("description", ""),
                            "examples": json.dumps(problem_data.get("examples", [])),
                            "constraints": json.dumps(problem_data.get("constraints", [])),
                            "starter_code": problem_data.get("starter_code", ""),
                            "test_cases": json.dumps(problem_data.get("test_cases", [])),
                            "points": problem_data.get("points", 100),
                            "tags": json.dumps(problem_data.get("tags", [ds, difficulty])),
                            "created_at": datetime.now()
                        }
                    )
                
                problems.append({
                    "id": problem_id,
                    "title": problem_data.get("title", f"Daily Problem {i+1}"),
                    "difficulty": difficulty,
                    "description": problem_data.get("description", ""),
                    "examples": problem_data.get("examples", []),
                    "constraints": problem_data.get("constraints", []),
                    "starter_code": problem_data.get("starter_code", ""),
                    "test_cases": problem_data.get("test_cases", []),
                    "points": problem_data.get("points", 100),
                    "tags": problem_data.get("tags", [ds]),
                    "function_name": problem_data.get("function_name", "solution")
                })
            
            return {
                "contest_date": today.isoformat(),
                "problems": problems,
                "message": f"Generated {len(problems)} new problems for today",
                "generated_at": datetime.now().isoformat()
            }
    
    except Exception as e:
        logging.error(f"Error generating daily problems: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating daily problems: {str(e)}")

def create_fallback_problem_data(index, data_structure, difficulty):
    """Create reliable fallback problem data"""
    fallback_problems = [
        {
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            "examples": [
                {
                    "input": "[2,7,11,15], 9",
                    "expected_output": "[0,1]",
                    "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
                }
            ],
            "constraints": [
                "2 <= nums.length <= 10^4",
                "-10^9 <= nums[i] <= 10^9",
                "-10^9 <= target <= 10^9"
            ],
            "starter_code": "def two_sum(nums, target):\n    # Your code here\n    return [0, 1]",
            "test_cases": [
                {"input": "[2,7,11,15], 9", "expected_output": "[0,1]"},
                {"input": "[3,2,4], 6", "expected_output": "[1,2]"},
                {"input": "[3,3], 6", "expected_output": "[0,1]"}
            ],
            "points": 100,
            "tags": [data_structure, "array", "easy"],
            "function_name": "two_sum"
        },
        {
            "title": "Reverse String",
            "description": "Write a function that reverses a string. The input string is given as an array of characters. You must do this by modifying the input array in-place with O(1) extra memory.",
            "examples": [
                {
                    "input": "['h','e','l','l','o']",
                    "expected_output": "['o','l','l','e','h']",
                    "explanation": "The string is reversed in place."
                }
            ],
            "constraints": [
                "1 <= s.length <= 10^5",
                "s[i] is a printable ascii character"
            ],
            "starter_code": "def reverse_string(s):\n    # Modify s in-place instead\n    pass",
            "test_cases": [
                {"input": "['h','e','l','l','o']", "expected_output": "['o','l','l','e','h']"},
                {"input": "['H','a','n','n','a','h']", "expected_output": "['h','a','n','n','a','H']"}
            ],
            "points": 100,
            "tags": [data_structure, "string", "easy"],
            "function_name": "reverse_string"
        },
        {
            "title": "Palindrome Check",
            "description": "Given a string s, return true if it is a palindrome, false otherwise. A palindrome is a string that reads the same forward and backward.",
            "examples": [
                {
                    "input": "'racecar'",
                    "expected_output": "True",
                    "explanation": "'racecar' reads the same forward and backward."
                },
                {
                    "input": "'hello'",
                    "expected_output": "False", 
                    "explanation": "'hello' does not read the same backward."
                }
            ],
            "constraints": [
                "1 <= s.length <= 2 * 10^5",
                "s consists only of printable ASCII characters"
            ],
            "starter_code": "def is_palindrome(s):\n    # Your code here\n    return True",
            "test_cases": [
                {"input": "'racecar'", "expected_output": "True"},
                {"input": "'hello'", "expected_output": "False"},
                {"input": "'a'", "expected_output": "True"},
                {"input": "'abba'", "expected_output": "True"}
            ],
            "points": 100,
            "tags": [data_structure, "string", "easy"],
            "function_name": "is_palindrome"
        },
        {
            "title": "Maximum Subarray",
            "description": "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
            "examples": [
                {
                    "input": "[-2,1,-3,4,-1,2,1,-5,4]",
                    "expected_output": "6",
                    "explanation": "[4,-1,2,1] has the largest sum = 6."
                }
            ],
            "constraints": [
                "1 <= nums.length <= 10^5",
                "-10^4 <= nums[i] <= 10^4"
            ],
            "starter_code": "def max_subarray(nums):\n    # Your code here\n    return 0",
            "test_cases": [
                {"input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected_output": "6"},
                {"input": "[1]", "expected_output": "1"},
                {"input": "[5,4,-1,7,8]", "expected_output": "23"}
            ],
            "points": 200,
            "tags": [data_structure, "array", "medium"],
            "function_name": "max_subarray"
        },
        {
            "title": "Valid Parentheses",
            "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: 1. Open brackets must be closed by the same type of brackets. 2. Open brackets must be closed in the correct order.",
            "examples": [
                {
                    "input": "'()'",
                    "expected_output": "True",
                    "explanation": "The parentheses are properly closed."
                },
                {
                    "input": "'()[]{}'", 
                    "expected_output": "True",
                    "explanation": "All brackets are properly closed."
                }
            ],
            "constraints": [
                "1 <= s.length <= 10^4",
                "s consists of parentheses only '()[]{}'"
            ],
            "starter_code": "def is_valid(s):\n    # Your code here\n    return True",
            "test_cases": [
                {"input": "'()'", "expected_output": "True"},
                {"input": "'()[]{}'", "expected_output": "True"},
                {"input": "'(]'", "expected_output": "False"},
                {"input": "'([)]'", "expected_output": "False"}
            ],
            "points": 100,
            "tags": [data_structure, "string", "stack", "easy"],
            "function_name": "is_valid"
        }
    ]
    return fallback_problems[index % len(fallback_problems)]
@app.get("/api/contest/today-problems")
def get_today_contest_problems(current_user=Depends(get_current_user)):
    """Get today's contest problems if they exist"""
    try:
        today = datetime.now().date()
        
        with engine.connect() as conn:
            # First check if function_name column exists
            try:
                result = conn.execute(
                    text("""
                        SELECT id, title, difficulty, description, examples, constraints, 
                               starter_code, test_cases, points, tags, function_name, created_at
                        FROM public.contest_problems 
                        WHERE date(created_at) = :today
                        ORDER BY 
                            CASE difficulty 
                                WHEN 'easy' THEN 1 
                                WHEN 'medium' THEN 2 
                                WHEN 'hard' THEN 3 
                            END,
                            created_at
                    """),
                    {"today": today}
                )
            except Exception as e:
                # If function_name doesn't exist, query without it
                logging.warning(f"function_name column not found, using fallback: {str(e)}")
                result = conn.execute(
                    text("""
                        SELECT id, title, difficulty, description, examples, constraints, 
                               starter_code, test_cases, points, tags, created_at
                        FROM public.contest_problems 
                        WHERE date(created_at) = :today
                        ORDER BY 
                            CASE difficulty 
                                WHEN 'easy' THEN 1 
                                WHEN 'medium' THEN 2 
                                WHEN 'hard' THEN 3 
                            END,
                            created_at
                    """),
                    {"today": today}
                )
            
            problems = []
            for row in result:
                problem_data = {
                    "id": str(row.id),
                    "title": row.title,
                    "difficulty": row.difficulty,
                    "description": row.description,
                    "examples": row.examples if row.examples else [],
                    "constraints": row.constraints if row.constraints else [],
                    "starter_code": row.starter_code,
                    "test_cases": row.test_cases if row.test_cases else [],
                    "points": row.points,
                    "tags": row.tags if row.tags else []
                }
                
                # Add function_name if it exists in the row
                if hasattr(row, 'function_name'):
                    problem_data["function_name"] = row.function_name or "solution"
                else:
                    # Extract function name from starter code
                    starter_code = row.starter_code or ""
                    if "def " in starter_code:
                        func_line = starter_code.split("def ")[1].split("(")[0].strip()
                        problem_data["function_name"] = func_line
                    else:
                        problem_data["function_name"] = "solution"
                
                problems.append(problem_data)
            
            return {
                "contest_date": today.isoformat(),
                "problems": problems,
                "has_problems": len(problems) > 0,
                "count": len(problems)
            }
    
    except Exception as e:
        logging.error(f"Error fetching today's problems: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching today's problems: {str(e)}")

# Enhanced code execution with actual evaluation
@app.post("/api/contest/submit-solution")
def submit_contest_solution(submission: ContestSubmission, current_user=Depends(get_current_user)):
    """Submit and evaluate solution for a contest problem"""
    try:
        submission_id = str(uuid.uuid4())
        
        with engine.begin() as conn:
            # Get problem details
            problem_result = conn.execute(
                text("""
                    SELECT test_cases, points, difficulty, function_name, starter_code 
                    FROM public.contest_problems 
                    WHERE id = :problem_id
                """),
                {"problem_id": submission.problem_id}
            )
            
            problem = problem_result.fetchone()
            if not problem:
                raise HTTPException(status_code=404, detail="Problem not found")
            
            test_cases = problem.test_cases if problem.test_cases else []
            function_name = problem.function_name or "solution"
            
            # Evaluate solution
            evaluation_results = evaluate_solution_code(
                submission.code, 
                test_cases, 
                submission.language,
                function_name
            )
            
            # Calculate score
            passed_cases = evaluation_results["test_cases_passed"]
            total_cases = evaluation_results["total_test_cases"]
            success_rate = passed_cases / total_cases if total_cases > 0 else 0
            
            if success_rate == 1.0:
                status = "accepted"
                score = problem.points
            elif success_rate > 0:
                status = "partial"
                score = int(problem.points * success_rate * 0.5)  # Half points for partial
            else:
                status = "wrong_answer"
                score = 0
            
            # Store submission
            conn.execute(
                text("""
                    INSERT INTO public.contest_submissions 
                    (id, user_id, problem_id, code, language, status, 
                     execution_time, memory_used, test_cases_passed, total_test_cases, 
                     score, submitted_at, evaluation_results)
                    VALUES (:id, :user_id, :problem_id, :code, :language, :status,
                           :execution_time, :memory_used, :test_cases_passed, :total_test_cases,
                           :score, :submitted_at, :evaluation_results)
                """),
                {
                    "id": submission_id,
                    "user_id": current_user.id,
                    "problem_id": submission.problem_id,
                    "code": submission.code,
                    "language": submission.language,
                    "status": status,
                    "execution_time": evaluation_results.get("total_execution_time", 0),
                    "memory_used": evaluation_results.get("max_memory_used", 0),
                    "test_cases_passed": passed_cases,
                    "total_test_cases": total_cases,
                    "score": score,
                    "submitted_at": datetime.now(),
                    "evaluation_results": json.dumps(evaluation_results.get("results", []))
                }
            )
            
            return {
                "submission_id": submission_id,
                "status": status,
                "test_cases_passed": passed_cases,
                "total_test_cases": total_cases,
                "score": score,
                "execution_time": evaluation_results.get("total_execution_time", 0),
                "memory_used": evaluation_results.get("max_memory_used", 0),
                "results": evaluation_results.get("results", []),
                "success_rate": f"{(success_rate * 100):.1f}%"
            }
    
    except Exception as e:
        logging.error(f"Error submitting solution: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error submitting solution: {str(e)}")

def evaluate_solution_code(code: str, test_cases: List[Dict], language: str, function_name: str) -> Dict:
    """Evaluate code against test cases"""
    if language != "python":
        return evaluate_other_languages(code, test_cases, language, function_name)
    
    return evaluate_python_code(code, test_cases, function_name)

def evaluate_python_code(code: str, test_cases: List[Dict], function_name: str = None) -> Dict:
    """Evaluate Python code against test cases"""
    results = []
    total_execution_time = 0
    test_cases_passed = 0
    
    try:
        # Create a temporary module with the user's code
        local_namespace = {}
        
        # Add safe imports
        safe_imports = """
import math
import string
import re
import json
import datetime
import collections
import itertools
import functools
import operator
"""
        # Execute safe imports
        exec(safe_imports, local_namespace)
        
        # Execute user code
        exec(code, local_namespace)
        
        # Try to detect function name if not provided
        if not function_name:
            # Look for function definitions in the code
            for key in local_namespace.keys():
                if callable(local_namespace[key]) and not key.startswith('_'):
                    function_name = key
                    break
        
        if not function_name:
            function_name = "solution"  # Default fallback
        
        # Get the solution function
        solution_func = local_namespace.get(function_name)
        if not solution_func:
            return {
                "test_cases_passed": 0,
                "total_test_cases": len(test_cases),
                "total_execution_time": 0,
                "max_memory_used": 0,
                "results": [{
                    "test_case": i + 1,
                    "input": tc.get("input", ""),
                    "expected_output": tc.get("expected_output", ""),
                    "actual_output": f"Error: Function '{function_name}' not found",
                    "passed": False,
                    "execution_time": 0,
                    "error": f"Function '{function_name}' not found in code"
                } for i, tc in enumerate(test_cases)]
            }
        
        # Test each test case
        for i, test_case in enumerate(test_cases):
            start_time = time.time()
            try:
                input_str = test_case.get("input", "")
                expected_output = test_case.get("expected_output", "")
                
                # Convert input to Python objects (basic parsing)
                try:
                    # Try to evaluate as Python literal
                    input_data = eval(input_str)
                except:
                    # Use as string if evaluation fails
                    input_data = input_str
                
                # Execute the function
                if isinstance(input_data, tuple):
                    result = solution_func(*input_data)
                else:
                    result = solution_func(input_data)
                
                execution_time = time.time() - start_time
                total_execution_time += execution_time
                
                # Compare results
                try:
                    expected = eval(expected_output)
                    passed = result == expected
                except:
                    # String comparison if evaluation fails
                    passed = str(result).strip() == expected_output.strip()
                
                if passed:
                    test_cases_passed += 1
                
                results.append({
                    "test_case": i + 1,
                    "input": input_str,
                    "expected_output": expected_output,
                    "actual_output": str(result),
                    "passed": passed,
                    "execution_time": execution_time,
                    "memory_used": 0,  # Simplified for now
                    "error": None
                })
                
            except Exception as e:
                execution_time = time.time() - start_time
                total_execution_time += execution_time
                results.append({
                    "test_case": i + 1,
                    "input": test_case.get("input", ""),
                    "expected_output": test_case.get("expected_output", ""),
                    "actual_output": f"Error: {str(e)}",
                    "passed": False,
                    "execution_time": execution_time,
                    "memory_used": 0,
                    "error": str(e)
                })
        
        return {
            "test_cases_passed": test_cases_passed,
            "total_test_cases": len(test_cases),
            "total_execution_time": total_execution_time,
            "max_memory_used": 0,
            "results": results
        }
        
    except Exception as e:
        return {
            "test_cases_passed": 0,
            "total_test_cases": len(test_cases),
            "total_execution_time": 0,
            "max_memory_used": 0,
            "results": [{
                "test_case": i + 1,
                "input": tc.get("input", ""),
                "expected_output": tc.get("expected_output", ""),
                "actual_output": f"Compilation Error: {str(e)}",
                "passed": False,
                "execution_time": 0,
                "error": str(e)
            } for i, tc in enumerate(test_cases)]
        }

def evaluate_other_languages(code: str, test_cases: List[Dict], language: str, function_name: str) -> Dict:
    """Placeholder for other language evaluation"""
    # For now, return simulated results for other languages
    results = []
    test_cases_passed = 0
    
    for i, test_case in enumerate(test_cases):
        # Simulate execution for non-Python languages
        execution_time = random.uniform(0.1, 1.0)
        memory_used = random.uniform(1.0, 10.0)
        
        # Simulate 70% pass rate for demo
        passed = random.random() > 0.3
        
        if passed:
            test_cases_passed += 1
        
        results.append({
            "test_case": i + 1,
            "input": test_case.get("input", ""),
            "expected_output": test_case.get("expected_output", ""),
            "actual_output": test_case.get("expected_output", "") if passed else "wrong_output",
            "passed": passed,
            "execution_time": execution_time,
            "memory_used": memory_used,
            "error": None if passed else "Wrong answer"
        })
    
    return {
        "test_cases_passed": test_cases_passed,
        "total_test_cases": len(test_cases),
        "total_execution_time": sum(r["execution_time"] for r in results),
        "max_memory_used": max(r["memory_used"] for r in results),
        "results": results
    }

@app.get("/api/contest/today-problems")
def get_today_contest_problems(current_user=Depends(get_current_user)):
    """Get today's contest problems if they exist"""
    try:
        today = datetime.now().date()
        
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT * FROM public.contest_problems 
                    WHERE date(created_at) = :today
                    ORDER BY 
                        CASE difficulty 
                            WHEN 'easy' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'hard' THEN 3 
                        END,
                        created_at
                """),
                {"today": today}
            )
            
            problems = []
            for row in result:
                problems.append({
                    "id": str(row.id),
                    "title": row.title,
                    "difficulty": row.difficulty,
                    "description": row.description,
                    "examples": row.examples if row.examples else [],
                    "constraints": row.constraints if row.constraints else [],
                    "starter_code": row.starter_code,
                    "test_cases": row.test_cases if row.test_cases else [],
                    "points": row.points,
                    "tags": row.tags if row.tags else [],
                    "function_name": row.function_name or "solution"
                })
            
            return {
                "contest_date": today.isoformat(),
                "problems": problems,
                "has_problems": len(problems) > 0,
                "count": len(problems)
            }
    
    except Exception as e:
        logging.error(f"Error fetching today's problems: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching today's problems: {str(e)}")