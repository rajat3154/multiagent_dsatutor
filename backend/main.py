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




@app.post("/api/mentor/learning-path")
def generate_topic_learning_path(payload: LearningPathRequest):
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

        return {
            "topic": topic,
            "level": level,
            "image_url": image_url,
            "sources": sources,
            "learning_plan": learning_plan
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