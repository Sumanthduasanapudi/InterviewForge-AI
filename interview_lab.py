import json
import random
import socket
import sqlite3
import urllib.error
import urllib.request

from database import get_connection, initialize_database


# ==================================================
# INTERVIEW QUESTION BANK
# ==================================================

QUESTION_BANK = {

    "Python": {

        "Beginner": [
            "What is the difference between a list and a tuple in Python?",
            "What is a Python dictionary and when would you use one?",
            "Explain the difference between == and is in Python.",
            "What is a function in Python?",
            "What are Python loops used for?"
        ],

        "Intermediate": [
            "What is the difference between shallow copy and deep copy in Python?",
            "Explain Python decorators and give a practical use case.",
            "What are *args and **kwargs in Python?",
            "Explain exception handling using try, except, else, and finally.",
            "What is the difference between a generator and a normal function?"
        ],

        "Advanced": [
            "Explain Python's Global Interpreter Lock and its impact on concurrency.",
            "What are context managers and how does the with statement work?",
            "Explain the difference between multiprocessing, threading, and asyncio.",
            "How does Python memory management work?",
            "Explain descriptors in Python."
        ]
    },


    "Machine Learning": {

        "Beginner": [
            "What is the difference between supervised and unsupervised learning?",
            "What is overfitting in machine learning?",
            "What is a training dataset?",
            "Explain classification and regression.",
            "Why do we split data into training and testing sets?"
        ],

        "Intermediate": [
            "What is the bias-variance tradeoff?",
            "Explain precision, recall, and F1 score.",
            "What is cross-validation and why is it useful?",
            "How does a decision tree make predictions?",
            "What is feature engineering?"
        ],

        "Advanced": [
            "Explain gradient descent and the role of the learning rate.",
            "How would you handle severe class imbalance?",
            "Explain regularization and compare L1 and L2.",
            "How would you diagnose model performance degradation in production?",
            "Explain the difference between bagging and boosting."
        ]
    },


    "GenAI": {

        "Beginner": [
            "What is generative AI?",
            "What is a large language model?",
            "What is a prompt in an LLM application?",
            "What is a token in the context of language models?",
            "What is hallucination in an LLM?"
        ],

        "Intermediate": [
            "What is prompt engineering and why is it useful?",
            "Explain temperature in language model generation.",
            "What is the difference between an embedding model and a generative model?",
            "What is a context window?",
            "What are some techniques for reducing hallucinations?"
        ],

        "Advanced": [
            "Compare fine-tuning and retrieval-augmented generation.",
            "Explain how transformer attention works at a high level.",
            "How would you evaluate a production GenAI application?",
            "What are the main challenges when serving LLMs locally?",
            "How would you design a guardrail system for an LLM application?"
        ]
    },


    "RAG": {

        "Beginner": [
            "What does RAG stand for and what problem does it solve?",
            "What is an embedding in a RAG system?",
            "What is a vector database?",
            "Why do we split documents into chunks?",
            "What happens after relevant chunks are retrieved?"
        ],

        "Intermediate": [
            "Explain the complete RAG pipeline from document ingestion to answer generation.",
            "What is chunk overlap and why can it improve retrieval?",
            "What is semantic search?",
            "How would you determine whether retrieved context is relevant enough?",
            "Why should a RAG application show source passages?"
        ],

        "Advanced": [
            "Compare dense retrieval and sparse retrieval in RAG.",
            "What is hybrid retrieval and why can it improve RAG quality?",
            "Explain Reciprocal Rank Fusion.",
            "What is a cross-encoder reranker and why is it useful?",
            "How would you evaluate retrieval quality separately from generation quality?"
        ]
    }
}


# ==================================================
# VALID OPTIONS
# ==================================================

VALID_TOPICS = list(
    QUESTION_BANK.keys()
)

VALID_DIFFICULTIES = [
    "Beginner",
    "Intermediate",
    "Advanced"
]


# ==================================================
# OLLAMA
# ==================================================

def ask_ollama(
    prompt,
    num_predict=500
):

    data = {
        "model": "llama3.2:3b",

        "prompt": prompt,

        "stream": False,

        "keep_alive": "30m",

        "format": "json",

        "options": {
            "temperature": 0.2,
            "num_ctx": 4096,
            "num_predict": num_predict
        }
    }


    request = urllib.request.Request(
        "http://localhost:11434/api/generate",

        data=json.dumps(
            data
        ).encode("utf-8"),

        headers={
            "Content-Type":
            "application/json"
        }
    )


    try:

        with urllib.request.urlopen(
            request,
            timeout=180
        ) as response:

            result = json.loads(
                response.read().decode(
                    "utf-8"
                )
            )


        return result[
            "response"
        ].strip()


    except socket.timeout:

        raise RuntimeError(
            "Ollama took too long to respond."
        )


    except urllib.error.URLError:

        raise RuntimeError(
            "Ollama is not available."
        )


# ==================================================
# GET QUESTION
# ==================================================

def get_interview_question(
    topic,
    difficulty,
    previous_questions=None
):

    if topic not in QUESTION_BANK:

        return {
            "error":
            "Invalid interview topic."
        }


    if difficulty not in QUESTION_BANK[
        topic
    ]:

        return {
            "error":
            "Invalid difficulty."
        }


    questions = QUESTION_BANK[
        topic
    ][
        difficulty
    ]


    previous_questions = (
        previous_questions or []
    )


    available = [
        question
        for question in questions
        if question not in previous_questions
    ]


    if not available:

        available = questions


    question = random.choice(
        available
    )


    return {
        "topic": topic,
        "difficulty": difficulty,
        "question": question
    }


# ==================================================
# PARSE OLLAMA JSON
# ==================================================

def parse_evaluation(
    raw_response
):

    try:

        data = json.loads(
            raw_response
        )


        correctness = int(
            data.get(
                "correctness",
                0
            )
        )


        clarity = int(
            data.get(
                "clarity",
                0
            )
        )


        depth = int(
            data.get(
                "depth",
                0
            )
        )


        correctness = max(
            0,
            min(
                correctness,
                10
            )
        )


        clarity = max(
            0,
            min(
                clarity,
                10
            )
        )


        depth = max(
            0,
            min(
                depth,
                10
            )
        )


        total_score = round(
            (
                correctness
                + clarity
                + depth
            )
            / 30
            * 100
        )


        return {
            "correctness":
                correctness,

            "clarity":
                clarity,

            "depth":
                depth,

            "total_score":
                total_score,

            "feedback":
                data.get(
                    "feedback",
                    "No feedback provided."
                ),

            "strong_points":
                data.get(
                    "strong_points",
                    []
                ),

            "improvements":
                data.get(
                    "improvements",
                    []
                ),

            "sample_answer":
                data.get(
                    "sample_answer",
                    ""
                ),

            "follow_up_question":
                data.get(
                    "follow_up_question",
                    ""
                )
        }


    except (
        json.JSONDecodeError,
        TypeError,
        ValueError
    ):

        return {
            "correctness": 0,
            "clarity": 0,
            "depth": 0,
            "total_score": 0,

            "feedback":
                (
                    "The AI evaluation could "
                    "not be parsed correctly."
                ),

            "strong_points": [],
            "improvements": [],

            "sample_answer": "",

            "follow_up_question": ""
        }


# ==================================================
# SAVE INTERVIEW RESULT
# ==================================================

def save_interview_attempt(
    topic,
    difficulty,
    question,
    answer,
    evaluation
):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        INSERT INTO interview_attempts (
            topic,
            difficulty,
            question,
            answer,
            correctness,
            clarity,
            depth,
            total_score,
            feedback
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,

        (
            topic,
            difficulty,
            question,
            answer,

            evaluation[
                "correctness"
            ],

            evaluation[
                "clarity"
            ],

            evaluation[
                "depth"
            ],

            evaluation[
                "total_score"
            ],

            evaluation[
                "feedback"
            ]
        )
    )


    cursor.execute(
        """
        INSERT INTO practice_activity (
            activity_type,
            topic,
            score
        )
        VALUES (?, ?, ?)
        """,

        (
            "interview",
            topic,

            evaluation[
                "total_score"
            ]
        )
    )


    connection.commit()

    connection.close()


# ==================================================
# EVALUATE INTERVIEW ANSWER
# ==================================================

def evaluate_interview_answer(
    topic,
    difficulty,
    question,
    answer
):

    if not answer.strip():

        return {
            "error":
            "Interview answer cannot be empty."
        }


    prompt = f"""
You are a professional technical interviewer.

Evaluate the candidate's answer.

INTERVIEW TOPIC:
{topic}

DIFFICULTY:
{difficulty}

QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

Evaluate the answer on these dimensions:

1. Correctness
2. Clarity
3. Technical depth

Each score must be from 0 to 10.

Be fair for the selected difficulty.

A beginner answer should not require
advanced-level depth.

Do not give points for incorrect statements.

Give practical, constructive feedback.

Generate a follow-up question that naturally
tests the candidate's understanding further.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "correctness": 0,
    "clarity": 0,
    "depth": 0,

    "feedback": "short overall feedback",

    "strong_points": [
        "point 1"
    ],

    "improvements": [
        "improvement 1"
    ],

    "sample_answer":
        "a strong example answer",

    "follow_up_question":
        "one relevant follow-up question"
}}
"""


    try:

        raw_response = ask_ollama(
            prompt,
            num_predict=650
        )


    except RuntimeError as error:

        return {
            "error":
            str(error)
        }


    evaluation = parse_evaluation(
        raw_response
    )


    save_interview_attempt(
        topic=topic,
        difficulty=difficulty,
        question=question,
        answer=answer,
        evaluation=evaluation
    )


    return {
        "topic":
            topic,

        "difficulty":
            difficulty,

        "question":
            question,

        "answer":
            answer,

        **evaluation
    }


# ==================================================
# TEST INTERVIEW LOCALLY
# ==================================================

if __name__ == "__main__":

    initialize_database()


    print(
        "\nInterviewForge AI - Interview Lab"
    )

    print(
        "=" * 50
    )


    topic = "RAG"

    difficulty = "Beginner"


    question_data = get_interview_question(
        topic,
        difficulty
    )


    question = question_data[
        "question"
    ]


    print(
        f"\nTopic: {topic}"
    )

    print(
        f"Difficulty: {difficulty}"
    )

    print(
        f"\nQuestion:\n{question}"
    )


    answer = input(
        "\nYour answer:\n"
    )


    print(
        "\nEvaluating with Ollama..."
    )


    result = evaluate_interview_answer(
        topic=topic,
        difficulty=difficulty,
        question=question,
        answer=answer
    )


    print(
        "\nRESULT"
    )

    print(
        "=" * 50
    )


    print(
        json.dumps(
            result,
            indent=2
        )
    )