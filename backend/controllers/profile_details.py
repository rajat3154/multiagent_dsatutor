from config import engine
from sqlalchemy import text
from fastapi import HTTPException,Depends
from controllers.auth import get_current_user
import json
def get_profile(current_user):
    """
    Returns the profile of the logged-in user.
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "profilePhoto": current_user.profilephoto,
        "level": current_user.level,
        "profile": current_user.profile  
    }

def get_my_concepts(current_user):
    """
    Fetch all DSA concepts/explanations created by the logged-in user.
    """
    try:
        with engine.begin() as conn:
            response=conn.execute(
                text("""
                    SELECT id, title, content, markdown_content, language, difficulty, created_at, updated_at
                    FROM dsa_explanations
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                """),{"user_id":current_user.id}
            ).fetchall()
            concepts=[]
            for row in response:
                concepts.append({
                    "id":str(row.id),
                    "title":row.title,
                    "content":row.content,
                    "markdown_content":row.markdown_content,
                    "language": row.language,
                    "difficulty": row.difficulty,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at
                })
            return {"user_id":str(current_user.id),"concepts":concepts}
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))

def solved_problems(current_user=Depends(get_current_user)):
    """
    Fetch all solved problems for the logged-in user.
    Returns problem info + user solution + evaluation results.
    """
    try:
        with engine.begin() as conn:
            result=conn.execute(
                text("""
                    SELECT * FROM public.user_solved_problems WHERE user_id=:uid ORDER BY solved_at DESC
                    """),{"uid":current_user.id}
            ).mappings().all()   
        solved_problems=[]
        for row in result:
            solved_problems.append({
                "solved_id":row["id"],
                "problem_id":row.get("problem_id"),
                "title":row["title"],
                "description":row["description"],
                "difficulty":row["difficulty"],
                "examples": json.dumps(row["examples"]) if row["examples"] else [],
                "constraints": json.dumps(row["constraints"]) if row["constraints"] else [],
                "starter_code": row["starter_code"],
                "optimal_solution": row["optimal_solution"],
                "optimal_explanation": row["optimal_explanation"],
                "user_solution": row["user_solution"],
                "language": row["language"],
                "execution_result": json.dumps(row["execution_result"]) if row["execution_result"] else {},
                "solved_at": row["solved_at"].isoformat() if row["solved_at"] else None
            })
        return {"solved_problems":solved_problems}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching solved problems: {str(e)}")