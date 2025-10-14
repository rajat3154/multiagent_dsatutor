from schema.schemas import ExplainationRequest,ExplainationResponse,SolutionRequest,ProblemRequest
from controllers.auth import get_current_user
from fastapi import Depends,HTTPException
from sqlalchemy import text
from agents.teacher_agent import teacher_agent
from agents.examiner_agent import examiner_agent
from agents.checker_agent import checker_agent
import uuid,json,logging
from config import engine

def generate_explaination(request:ExplainationRequest,current_user):
    """
    Generate an explanation for a DSA concept and store it in the DB, 
    then add the explanation's UUID to the user's learned_concepts.
    """
    try:
        explaination=teacher_agent(request.concept,request.language,request.difficulty)
        markdown_content=f"# {request.concept}\n\n {explaination}"
        explaination_id=str(uuid.uuid4())
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO dsa_explanations(id,user_id,title,content,markdown_content,language,difficulty,created_at,updated_at) VALUES (:id,:user_id,:title,:content,:markdown_content,:language,:difficulty,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
                ),{
                    "id":explaination_id,
                    "user_id":current_user.id,
                    "title":request.concept,
                    "content":explaination,
                    "markdown_content": markdown_content,
                    "language":request.language,
                    "difficulty":request.difficulty
                }
            )
            profile=current_user.profile if current_user.profile else {}
            if "learned_concepts" not in profile:
                profile["learned_concepts"]=[]
            profile["learned_concepts"].append(explaination_id)
            conn.execute(
                text("UPDATE users SET profile=:profile WHERE id=:id"),{"profile":json.dumps(profile),"id":current_user.id}
            )
            return ExplainationResponse(
                title=request.concept,
                content=explaination,
                markdown_content=markdown_content
            )
    except Exception as e:
        logging.error(f"Error generating explainations : {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")
    
