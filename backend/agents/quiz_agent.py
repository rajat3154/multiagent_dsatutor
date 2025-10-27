from schema.schemas import QuizRequest, QuizResponse, Question, EvaluationResult
from config import client
from fastapi import HTTPException
from typing import Dict, Any
import json,re,time,math
import uuid

quizzes_db = {}

def clean_json(raw_content: str):
    """Extract valid JSON array from LLM output."""
    raw_content = re.sub(r"```(json)?", "", raw_content).strip("` \n")
    json_match = re.search(r"\[.*\]", raw_content, re.DOTALL)
    if json_match:
        json_str = json_match.group(0)
    else:
        json_str = raw_content.strip()
    return json_str


def llm_generate_questions(topic, subtopic, language, num_questions):
    """Helper to call LLM and parse questions."""
    prompt = f"""
    Generate {num_questions} quiz questions for topic '{topic}' and subtopic '{subtopic}'
    in {language}.

    Return ONLY a valid JSON array — no markdown, no explanations.

    Each object must include:
    - id (int)
    - type ("mcq" or "text")
    - question (string)
    - options (list of strings, only for MCQs)
    - correct_answer (index for MCQ, text for text)
    - explanation (string)
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2000
    )

    raw_content = response.choices[0].message.content.strip()
    json_str = clean_json(raw_content)

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON from LLM. Partial output: {raw_content[:300]}"
        )


def generate_quiz(request: QuizRequest) -> QuizResponse:
    """Generate quiz safely even for large num_questions."""
    try:
        batch_size = 10  
        total_batches = math.ceil(request.num_questions / batch_size)

        all_questions = []
        for batch in range(total_batches):
            remaining = request.num_questions - len(all_questions)
            num_to_generate = min(batch_size, remaining)
            batch_questions = llm_generate_questions(
                request.topic, request.subtopic, request.language, num_to_generate
            )
            for i, q in enumerate(batch_questions):
                q["id"] = len(all_questions) + i + 1
            all_questions.extend(batch_questions)
            time.sleep(0.5)
        quiz_id = f"{request.topic}_{request.subtopic}_{request.difficulty}_{str(uuid.uuid4())[:8]}"
        time_limit = request.num_questions * (
            1 if request.difficulty == "easy"
            else 2 if request.difficulty == "medium"
            else 3
        )
        description = f"Test your knowledge of {request.subtopic} in {request.topic} using {request.language}."

        quiz = QuizResponse(
            quiz_id=quiz_id,
            title=f"{request.topic}: {request.subtopic} in {request.language}",
            description=description,
            questions=[Question(**q) for q in all_questions],
            time_limit=time_limit
        )

        quizzes_db[quiz_id] = quiz
        return quiz

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


def evaluate_quizzes_with_agent(quiz_id: str, answers: Dict[int, Any]) -> EvaluationResult:
    """Evaluate quiz answers dynamically using an LLM with better error handling."""
    if quiz_id not in quizzes_db:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz = quizzes_db[quiz_id]
    
    try:
        # Prepare quiz questions in a clean format
        quiz_questions = []
        for q in quiz.questions:
            question_data = {
                "id": q.id,
                "type": q.type,
                "question": q.question,
                "options": q.options if q.options else [],
                "correct_answer": q.correct_answer,
                "explanation": q.explanation
            }
            quiz_questions.append(question_data)

        prompt = f"""
        You are an expert teacher evaluating quiz answers. Be fair and constructive.

        QUIZ INFO:
        - Title: {quiz.title}
        - Description: {quiz.description}
        - Total Questions: {len(quiz.questions)}

        QUESTIONS AND CORRECT ANSWERS:
        {json.dumps(quiz_questions, indent=2, ensure_ascii=False)}

        USER'S ANSWERS:
        {json.dumps(answers, indent=2, ensure_ascii=False)}

        EVALUATION INSTRUCTIONS:
        1. Compare each user answer with the correct answer
        2. For MCQ: Check if the selected option index matches the correct_answer index
        3. For text answers: Check if the meaning matches (be lenient with phrasing)
        4. Calculate score as (correct_answers / total_questions) * 100
        5. Provide specific feedback for each question
        6. Give overall recommendations for improvement

        RETURN FORMAT (JSON only):
        {{
            "score": 85.0,
            "correct_answers": 4,
            "total_questions": 5,
            "feedback": {{
                "1": "Good job! Your answer is correct.",
                "2": "Incorrect. Remember that arrays are zero-indexed.",
                "3": "Partially correct, but missing the edge case."
            }},
            "recommendation": "Focus on array manipulation methods. Practice more with slice operations."
        }}

        Important: Return ONLY valid JSON, no additional text.
        """

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,  # Lower temperature for more consistent evaluation
            max_tokens=2000
        )

        raw_output = response.choices[0].message.content.strip()
        
        # Clean the response
        cleaned_output = re.sub(r"^```(?:json)?|```$", "", raw_output, flags=re.MULTILINE).strip()
        
        # Try to extract JSON
        json_match = re.search(r"\{.*\}", cleaned_output, re.DOTALL)
        if not json_match:
            # Fallback: create basic evaluation
            return create_fallback_evaluation(quiz, answers)
        
        json_str = json_match.group(0)
        
        try:
            result_data = json.loads(json_str)
            
            # Validate required fields
            required_fields = ["score", "correct_answers", "total_questions", "feedback"]
            for field in required_fields:
                if field not in result_data:
                    return create_fallback_evaluation(quiz, answers)
            
            return EvaluationResult(**result_data)
            
        except json.JSONDecodeError as e:
            logging.error(f"JSON parsing failed: {str(e)}")
            logging.error(f"Raw response: {raw_output[:500]}")
            return create_fallback_evaluation(quiz, answers)
            
    except Exception as e:
        logging.error(f"Error in evaluate_quizzes_with_agent: {str(e)}")
        return create_fallback_evaluation(quiz, answers)


def create_fallback_evaluation(quiz: QuizResponse, answers: Dict[int, Any]) -> EvaluationResult:
    """Create a basic evaluation when LLM evaluation fails."""
    try:
        total_questions = len(quiz.questions)
        correct_answers = 0
        feedback = {}
        
        # Simple evaluation logic
        for question in quiz.questions:
            user_answer = answers.get(question.id)
            if user_answer is not None:
                if question.type == "mcq":
                    # For MCQ, compare the selected option index
                    if user_answer == question.correct_answer:
                        correct_answers += 1
                        feedback[question.id] = "Correct! " + question.explanation
                    else:
                        feedback[question.id] = f"Incorrect. {question.explanation}"
                else:
                    # For text answers, do simple string comparison
                    if str(user_answer).strip().lower() == str(question.correct_answer).strip().lower():
                        correct_answers += 1
                        feedback[question.id] = "Correct! " + question.explanation
                    else:
                        feedback[question.id] = f"Expected: {question.correct_answer}. {question.explanation}"
            else:
                feedback[question.id] = "No answer provided. " + question.explanation
        
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        
        return EvaluationResult(
            score=round(score, 2),
            correct_answers=correct_answers,
            total_questions=total_questions,
            feedback=feedback,
            recommendation="Keep practicing to improve your understanding!"
        )
        
    except Exception as e:
        logging.error(f"Error in fallback evaluation: {str(e)}")
        # Ultimate fallback
        return EvaluationResult(
            score=0,
            correct_answers=0,
            total_questions=len(quiz.questions),
            feedback={},
            recommendation="Evaluation service temporarily unavailable. Please try again."
        )