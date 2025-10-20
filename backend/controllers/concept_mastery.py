from schema.schemas import ExplainationRequest,ExplainationResponse,SolutionRequest,ProblemRequest
from controllers.auth import get_current_user
from fastapi import Depends,HTTPException
from sqlalchemy import text
from agents.teacher_agent import teacher_agent
from agents.examiner_agent import examiner_agent
from agents.checker_agent import checker_agent
import uuid,json,logging
from config import engine
from agents.teacher_agent import fetch_concept_resources
import logging
from agents.teacher_agent import agent
from langchain.schema import AIMessage

from langchain.schema import AIMessage

def generate_explaination(request: ExplainationRequest, current_user):
    try:
        # Fetch image and sources
        image_url, sources = fetch_concept_resources(request.concept)

        # Call teacher_agent directly
        explanation_text = teacher_agent(
            concept=request.concept,
            language=request.language,
            difficulty=request.difficulty,
            image_url=image_url,
            sources=sources
        )

        # Fallback
        if not explanation_text or "Error generating explanation" in explanation_text:
            explanation_text = "Explanation not generated."

        # Build markdown
        markdown_content = f"# {request.concept}\n\n{explanation_text}"

        return ExplainationResponse(
            title=request.concept,
            content=explanation_text,
            markdown_content=markdown_content,
            image_url=image_url,
            sources=sources
        )

    except Exception as e:
        logging.error(f"Error generating explanation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")

