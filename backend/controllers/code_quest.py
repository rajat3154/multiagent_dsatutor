from schema.schemas import ProblemRequest,SolutionRequest
from agents.examiner_agent import examiner_agent
from agents.checker_agent import checker_agent
from fastapi import HTTPException
from sqlalchemy import text
from agents.examiner_agent import problems_db
from controllers.auth import get_current_user
from config import engine
import json,uuid
from fastapi import Depends
problems_db={}
def generate_problems(request: ProblemRequest, current_user):
    """
    Generate 10 problems using examiner agent and store them in problems_db
    """
    try:
        problems = examiner_agent(request.data_structure, request.topic)
        for problem in problems:
            problems_db[problem.id] = problem

        return {"problems": [p.dict() for p in problems]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating problems: {str(e)}")  
def evaluate_solution(request:SolutionRequest,current_user):
    problem=problems_db.get(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404,detail="Problem not found or expired")
    try:
        result=checker_agent(problem,request.code,request.language)
        if result.get("passed") is True:
            solved_id=str(uuid.uuid4())
            problem_id=getattr(problem,"id",request.problem_id)
            with engine.begin() as conn:
                conn.execute(
                    text("""
                         INSERT INTO public.user_solved_problems(
                         id,user_id,problem_id,title,description,difficulty,examples,constraints,starter_code,optimal_solution,optimal_explanation,user_solution,language,execution_result) VALUES (:id,:user_id,:problem_id,:title,:description,:difficulty,:examples,:constraints,:starter_code,:optimal_solution,:optimal_explanation,:user_solution,:language,:execution_result)   
                            """),{
                                "id": solved_id,
                        "user_id": current_user.id,
                        "problem_id": problem_id,
                        "title": problem.title,
                        "description": problem.description,
                        "difficulty": problem.difficulty,
                        "examples": json.dumps([ex.dict() for ex in problem.examples]),
                        "constraints": json.dumps(problem.constraints),
                        "starter_code": getattr(problem, "starter_code", None),
                        "optimal_solution": getattr(problem, "optimal_solution", None),
                        "optimal_explanation": getattr(problem, "optimal_explanation", None),
                        "user_solution": request.code,
                        "language": request.language,
                        "execution_result": json.dumps(result),
                            }
                )
                profile=current_user.profile if current_user.profile else {}
                solved_list=profile.get("solved_problems",[])
                solved_list.append(solved_id)
                profile["solved_problems"]=solved_list
                conn.execute(
                    text("UPDATE public.users SET profile=:profile WHERE id=:uid"),{
                        "profile":json.dumps(profile),"uid":current_user.id
                    }
                )
        return result
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Error evaluating solution : {str(e)}")  


def save_problem_for_user(problem_id:str,current_user=Depends(get_current_user)):
    """
    Save a problem ID to the logged-in user's profile under 'saved_problems'
    """
    try:
        problem=problems_db.get(problem_id)
        if not problem:
            raise HTTPException(status_code=404,detail="Problem not found")
        with engine.begin() as conn:
            conn.execute(
    text("""
        INSERT INTO problems(
            id, title, difficulty, description, examples,
            constraints, starter_code, optimal_solution, optimal_explanation,
            created_at, updated_at
        ) VALUES (
            :id, :title, :difficulty, :description, :examples,
            :constraints, :starter_code, :optimal_solution, :optimal_explanation,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO NOTHING
    """),
    {
        "id": problem.id,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "description": problem.description,
        "examples": json.dumps([ex.dict() for ex in problem.examples]),
        "constraints": json.dumps(problem.constraints),
        "starter_code": getattr(problem, "starter_code", None),
        "optimal_solution": getattr(problem, "optimal_solution", None),
        "optimal_explanation": getattr(problem, "optimal_explanation", None)
    }
)

            profile=current_user.profile if current_user.profile else {}
            saved=profile.get("saved_problems",[])
            if problem_id in saved:
                return {"message":"Problem already exists","saved_problems":profile["saved_problems"]}
            saved.append(problem_id)
            profile["saved_problems"]=saved

            conn.execute(
                text("UPDATE users SET profile=:profile WHERE id=:id"),
                {"profile": json.dumps(profile), "id": current_user.id}
            )
        return {"message":"Problem saved Successfully","saved_problems":profile["saved_problems"]}
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Error saving problem : {str(e)}")
def get_problem_by_id(problem_id:str):
    """Fetch detailed information about a specific problem from the database"""
    try:
        with engine.begin() as conn:
            result=conn.execute(
                text(
                    """
                    SELECT id,title,description,difficulty,examples,constraints,starter_code,optimal_solution,optimal_explanation,created_at FROM problems WHERE id=:problem_id
                    """
                ),{"problem_id":problem_id}
            ).fetchone()
            if not result:
                raise HTTPException(status_code=404,detail="Problem not found")
            def parse_field(value):
                """Parse JSON field safely (examples, constraints)."""
                if not value:
                    return []
                if isinstance(value,list):
                    return value
                try:
                    return json.loads(value) if isinstance(value,(str,bytes,bytearray)) else []
                except Exception:
                    return []
            return {
                "id":str(result.id),
                "title": result.title,
            "description": result.description,
            "difficulty": result.difficulty,
            "examples": parse_field(result.examples),
            "constraints": parse_field(result.constraints),
            "starter_code": result.starter_code,
            "optimal_solution": result.optimal_solution,
            "optimal_explanation": result.optimal_explanation,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            }
    except HTTPException:
            raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching problem: {str(e)}")
def unsave_problem_for_user(problem_id:str,current_user):
    """Remove a saved problem ID from the user's profile."""
    try:
        with engine.begin() as conn:
            profile=current_user.profile if current_user.profile else {}
            saved=profile.get("saved_problems",[])
            if problem_id not in saved:
                raise HTTPException(status_code=404,detail="Problem is not saved in list")
            saved.remove(problem_id)
            profile["saved_problems"]=saved
            conn.execute(
                text(
                    "UPDATE users SET profile=:profile WHERE id=:id"
                ),{"profile":json.dumps(profile),"id":current_user.id}
            )
        return {"message":"Problem unsaved successfully","saved_problems":profile["saved_problems"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unsaving problem: {str(e)}")



