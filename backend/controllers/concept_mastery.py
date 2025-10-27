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

        # Generate unique ID for the explanation
        explanation_id = str(uuid.uuid4())

        # Store explanation in dsa_explanations table
        with engine.begin() as conn:
            # Insert into dsa_explanations table
            conn.execute(
                text("""
                    INSERT INTO public.dsa_explanations 
                    (id, user_id, title, content, markdown_content, language, difficulty)
                    VALUES (:id, :user_id, :title, :content, :markdown_content, :language, :difficulty)
                """),
                {
                    "id": explanation_id,
                    "user_id": current_user.id,
                    "title": request.concept,
                    "content": explanation_text,
                    "markdown_content": markdown_content,
                    "language": request.language,
                    "difficulty": request.difficulty
                }
            )

            # Update user's profile to include this explanation ID
            profile = current_user.profile if current_user.profile else {}
            explanations_list = profile.get("explanations", [])
            
            # Add the new explanation ID to the list if not already present
            if explanation_id not in explanations_list:
                explanations_list.append(explanation_id)
                profile["explanations"] = explanations_list
                
                # Update user profile
                conn.execute(
                    text("UPDATE public.users SET profile = :profile WHERE id = :user_id"),
                    {
                        "profile": json.dumps(profile),
                        "user_id": current_user.id
                    }
                )

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