import google.generativeai as genai
from config import config
from logger import app_logger
import json
import re

def _extract_json(text: str) -> dict:
    """Safely extract JSON from Gemini response, handling markdown blocks."""
    text = text.strip()
    if text.startswith("```"):
        # Strip markdown fences
        text = re.sub(r"^```(?:json)?", "", text)
        text = re.sub(r"```$", "", text).strip()
    
    # Try parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # One last attempt to find a JSON object in the text
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        raise ValueError("Could not parse JSON from response")

# Initialize Gemini
def init_gemini():
    """Initialize Gemini API"""
    try:
        if not config.GEMINI_API_KEY:
            app_logger.warning("Gemini API key not set; using local fallback questions")
            return

        genai.configure(api_key=config.GEMINI_API_KEY)
        app_logger.info("Gemini API initialized successfully")
    except Exception as e:
        app_logger.error(f"Gemini initialization error: {e}")

init_gemini()

def _fallback_question(role: str, phase: str, question_number: int = 1, user_profile: dict | None = None) -> dict:
    role_name = (role or "Software Engineer").strip()

    if phase == "icebreaker":
        questions = [
            f"Tell me about yourself and what attracted you to {role_name}.",
            "Describe a project you're proud of. What trade-offs did you make and why?",
            "When you get stuck debugging, what is your step-by-step approach?",
        ]
        q = questions[(question_number - 1) % len(questions)]
        return {
            "question": q,
            "hints": [
                "Keep it structured: context -> actions -> results.",
                "Mention one concrete example and measurable impact.",
                "Be concise; aim for 60-90 seconds.",
            ],
            "expectedTopics": ["communication", "experience", "reflection"],
        }

    if phase == "introduction":
        return {
            "introduction": (
                f"Today’s interview is for a {role_name} role. We’ll start with a couple of warm-up questions, "
                "then move into 3 coding problems. As you solve, explain your thinking, assumptions, and complexity."
            )
        }

    # coding / wrapup default to coding-style prompts
    coding_bank = [
        {
            "question": (
                "Given a string, return the length of the longest substring without repeating characters.\n"
                "Example: input = \"abcabcbb\" → output = 3 (\"abc\")."
            ),
            "hints": ["Use a sliding window.", "Track last-seen indices in a map.", "Update the left bound when repeated."],
            "expectedTopics": ["hash map", "two pointers", "sliding window"],
        },
        {
            "question": (
                "Given an array of integers, return indices of the two numbers such that they add up to a target.\n"
                "Assume exactly one solution and you may not use the same element twice."
            ),
            "hints": ["Use a hash map from value → index.", "Check complement = target - x as you iterate."],
            "expectedTopics": ["hash map", "arrays"],
        },
        {
            "question": (
                "Implement a function to validate if a string of parentheses is valid.\n"
                "Valid strings: \"()[]{}\", \"([{}])\". Invalid: \"(]\", \"([)]\"."
            ),
            "hints": ["Use a stack.", "Push opening brackets, match on closing.", "Fail fast on mismatches."],
            "expectedTopics": ["stack", "parsing"],
        },
    ]
    return coding_bank[(question_number - 1) % len(coding_bank)]

def generate_question(role: str, phase: str, question_number: int = 1, user_profile: dict = None) -> dict:
    """Generate interview questions using Gemini"""
    try:
        if not config.GEMINI_API_KEY:
            return _fallback_question(role=role, phase=phase, question_number=question_number, user_profile=user_profile)

        model = genai.GenerativeModel('gemini-1.5-flash')
        
        if phase == "icebreaker":
            prompt = f"""Generate a warm-up icebreaker question for a technical interview candidate.
User profile: {user_profile}
This is question {question_number} out of 2-3 icebreaker questions.

Return a JSON object with:
- question: the actual question to ask
- hints: 2-3 tips for answering
- expectedTopics: list of topics expected in the answer

Format: {{"question": "...", "hints": [...], "expectedTopics": [...]}}
"""
        elif phase == "introduction":
            prompt = f"""Provide an introduction for a {role} technical interview.
Explain:
1. What the role entails
2. Key skills expected
3. What today's interview will cover

Return a JSON object with:
- introduction: the introduction text

Format: {{"introduction": "..."}}
"""
        else:  # coding phase
            prompt = f"""Generate a coding interview question for a {role} position.
This is question {question_number} out of 3 coding questions.
Difficulty: intermediate

Return a JSON object with:
- question: the coding problem statement
- hints: 2-3 hints to solve the problem
- expectedTopics: topics related to this problem
- example: sample input/output (optional)

Format: {{"question": "...", "hints": [...], "expectedTopics": [...], "example": "..."}}
"""
        
        response = model.generate_content(prompt)
        
        # Parse response
        try:
            result = _extract_json(response.text)
        except Exception as e:
            app_logger.warning(f"Failed to parse Gemini response: {e}, falling back.")
            result = {"question": response.text, "hints": [], "expectedTopics": []}
        
        return result
    except Exception as e:
        app_logger.error(f"Error generating question: {e}")
        # Keep localhost usable even if Gemini fails (quota, network, invalid key, etc.)
        return _fallback_question(role=role, phase=phase, question_number=question_number, user_profile=user_profile)

def evaluate_code(code: str, question: str, language: str, role: str) -> dict:
    """Evaluate submitted code using Gemini"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""You are a strict but fair technical interviewer evaluating code.

Role being interviewed for: {role}
Coding Question: {question}
Submitted Code ({language}):
```{language}
{code}
```

Evaluate the code and provide:
1. Correctness score (0-10)
2. Time complexity analysis
3. Space complexity analysis
4. List of bugs or issues found
5. Suggestions for improvement
6. 1-2 follow-up questions about the code

Return a JSON object:
{{"correctness": 8, "timeComplexity": "O(n)", "spaceComplexity": "O(1)", 
"bugs": [...], "suggestions": [...], 
"followupQuestions": ["question1", "question2"]}}
"""
        
        response = model.generate_content(prompt)
        
        try:
            result = _extract_json(response.text)
        except Exception as e:
            app_logger.warning(f"Failed to parse Gemini response: {e}, falling back.")
            result = {
                "correctness": 5,
                "timeComplexity": "Unknown",
                "spaceComplexity": "Unknown",
                "bugs": ["Could not fully evaluate code"],
                "suggestions": ["Consider edge cases"],
                "followupQuestions": ["Can you walk through your solution?"]
            }
        
        return result
    except Exception as e:
        app_logger.error(f"Error evaluating code: {e}")
        return {
            "correctness": 0,
            "timeComplexity": "Error",
            "spaceComplexity": "Error",
            "bugs": ["Evaluation error"],
            "suggestions": [],
            "followupQuestions": []
        }

def generate_feedback(all_answers: list, code_scores: list, voice_transcripts: list, role: str) -> dict:
    """Generate comprehensive interview feedback"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""As a senior technical interviewer, analyze this candidate's interview and provide comprehensive feedback.

Role: {role}
Answers: {all_answers}
Code Evaluation Scores: {code_scores}
Voice Transcripts: {voice_transcripts}

Provide:
1. Communication Score (0-25)
2. Problem Solving Score (0-25)
3. Code Quality Score (0-25)
4. Technical Knowledge Score (0-25)
5. 3 Strengths (areas they did well)
6. 3 Areas to Improve
7. Recommended resources or topics to study

Return JSON:
{{"totalScore": 75, "breakdown": {{"communication": 20, "problemSolving": 22, "codeQuality": 18, "technicalKnowledge": 15}},
"strengths": [...], "improvements": [...], "overallFeedback": "...", "resources": [...]}}
"""
        
        response = model.generate_content(prompt)
        
        try:
            result = _extract_json(response.text)
        except Exception as e:
            app_logger.warning(f"Failed to parse Gemini response: {e}, falling back.")
            result = {
                "totalScore": 50,
                "breakdown": {
                    "communication": 15,
                    "problemSolving": 15,
                    "codeQuality": 10,
                    "technicalKnowledge": 10
                },
                "strengths": ["Engaged", "Attempted all problems"],
                "improvements": ["Code clarity", "Edge case handling"],
                "overallFeedback": "Good effort. Keep practicing.",
                "resources": []
            }
        
        return result
    except Exception as e:
        app_logger.error(f"Error generating feedback: {e}")
        return {
            "totalScore": 0,
            "breakdown": {"communication": 0, "problemSolving": 0, "codeQuality": 0, "technicalKnowledge": 0},
            "strengths": [],
            "improvements": ["Error in evaluation"],
            "overallFeedback": "Technical error occurred",
            "resources": []
        }


def run_code(code: str, language: str, question: str) -> dict:
    """Analyze code using Gemini and predict output or detect errors."""
    try:
        if not config.GEMINI_API_KEY:
            return {
                "success": False,
                "output": "Code execution service unavailable (no API key configured).",
                "error": "Service unavailable",
            }

        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""You are a code execution engine. Carefully analyze the following {language} code.

```{language}
{code}
```

The coding question context is: {question}

Your job:
1. Check for syntax errors first. If there are syntax errors, return them.
2. Check for runtime errors (e.g. undefined variables, type errors, index out of bounds). If found, return them.
3. If the code is valid, trace through it step by step and determine what the output would be when executed.
4. If the code has no print/console output, describe what it returns.

Return ONLY a JSON object with these exact fields:
- "success": true if code runs without errors, false if it has errors
- "output": the actual console output the code would produce (or return value if no print). If there are errors, put the error message here.
- "error": null if no errors, or a short error description like "SyntaxError", "TypeError", "RuntimeError" etc.

Examples:
- Valid code: {{"success": true, "output": "Hello World\\n5", "error": null}}
- Syntax error: {{"success": false, "output": "SyntaxError: unexpected indent at line 3", "error": "SyntaxError"}}
- Runtime error: {{"success": false, "output": "TypeError: unsupported operand type(s) for +: 'int' and 'str'", "error": "TypeError"}}
- Empty/wrong code: {{"success": false, "output": "The code does not produce any output and does not solve the given problem.", "error": "NoOutput"}}

Return ONLY the JSON, no markdown, no explanation."""

        response = model.generate_content(prompt)

        try:
            result = _extract_json(response.text)
        except Exception:
            text = response.text.strip()
            # Try to clean up anyway for fallback
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                
            result = {
                "success": False,
                "output": text,
                "error": "ParseError",
            }

        return result
    except Exception as e:
        app_logger.error(f"Error running code: {e}")
        return {
            "success": False,
            "output": f"Code analysis failed: {str(e)}",
            "error": "ServiceError",
        }

