import hashlib
import json
import socket
import urllib.error
import urllib.request
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader

from retrieval import (
    collection,
    embedding_model,
    retrieve,
)

from database import initialize_database

from coding_gym import (
    evaluate_submission,
    get_exercise,
    get_exercises,
)

from interview_lab import (
    VALID_DIFFICULTIES,
    VALID_TOPICS,
    evaluate_interview_answer,
    get_interview_question,
)

from progress import get_dashboard


# ==================================================
# INITIALIZE DATABASE
# ==================================================

initialize_database()


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="InterviewForge AI API",
    version="5.0"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# CONFIGURATION
# ==================================================

DOCUMENTS_FOLDER = Path("documents")

DOCUMENTS_FOLDER.mkdir(
    exist_ok=True
)


SUPPORTED_FILES = {
    ".pdf",
    ".txt",
    ".md",
    ".py",
}


CHUNK_SIZE = 800

CHUNK_OVERLAP = 150

RERANKER_MIN_SCORE = -2.0

FAST_SUMMARY_MAX_CHUNKS = 8

SUMMARY_BATCH_SIZE = 8


# ==================================================
# REQUEST MODELS
# ==================================================

class QuestionRequest(BaseModel):
    question: str


class SummarizeRequest(BaseModel):
    source: str


class CodingSubmissionRequest(BaseModel):
    exercise_id: str
    code: str


class InterviewQuestionRequest(BaseModel):
    topic: str
    difficulty: str

    previous_questions: list[str] = Field(
        default_factory=list
    )


class InterviewEvaluationRequest(BaseModel):
    topic: str
    difficulty: str
    question: str
    answer: str


# ==================================================
# DOCUMENT READER
# ==================================================

def read_document(file_path):

    extension = file_path.suffix.lower()

    if extension == ".pdf":

        reader = PdfReader(
            file_path
        )

        pages = []

        for page_number, page in enumerate(
            reader.pages,
            start=1
        ):

            text = page.extract_text()

            if text:

                pages.append(
                    f"[Page {page_number}]\n{text}"
                )

        return "\n\n".join(
            pages
        )

    return file_path.read_text(
        encoding="utf-8",
        errors="ignore"
    )


# ==================================================
# CHUNKING
# ==================================================

def create_chunks(text):

    chunks = []

    start = 0

    while start < len(text):

        end = (
            start
            + CHUNK_SIZE
        )

        chunk = text[
            start:end
        ].strip()

        if chunk:

            chunks.append(
                chunk
            )

        start += (
            CHUNK_SIZE
            - CHUNK_OVERLAP
        )

    return chunks


# ==================================================
# CHUNK ID
# ==================================================

def create_chunk_id(
    source,
    chunk_number
):

    value = (
        f"{source}-{chunk_number}"
    )

    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


# ==================================================
# OLLAMA
# ==================================================

def ask_ollama(
    prompt,
    num_predict=400
):

    data = {
        "model": "llama3.2:3b",

        "prompt": prompt,

        "stream": False,

        "keep_alive": "30m",

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

        raise HTTPException(
            status_code=504,

            detail=(
                "Ollama took too long "
                "to generate a response."
            )
        )

    except urllib.error.URLError:

        raise HTTPException(
            status_code=503,

            detail=(
                "Ollama is not available. "
                "Make sure Ollama is running."
            )
        )


# ==================================================
# HEALTH
# ==================================================

@app.get("/health")
def health():

    return {
        "status":
            "ok",

        "version":
            "5.0",

        "llm":
            "llama3.2:3b",

        "retrieval":
            (
                "Semantic + BM25 + RRF "
                "+ Cross-Encoder"
            ),

        "coding_gym":
            "enabled",

        "interview_lab":
            "enabled",

        "progress_dashboard":
            "enabled",

        "total_chunks":
            collection.count()
    }


# ==================================================
# DOCUMENT LIST
# ==================================================

@app.get("/documents")
def list_documents():

    data = collection.get(
        include=[
            "metadatas"
        ]
    )

    document_counts = {}

    for metadata in data[
        "metadatas"
    ]:

        source = metadata.get(
            "source",
            "Unknown"
        )

        document_counts[
            source
        ] = (
            document_counts.get(
                source,
                0
            )
            + 1
        )

    documents = [

        {
            "source":
                source,

            "chunks":
                count
        }

        for source, count
        in sorted(
            document_counts.items()
        )
    ]

    return {
        "documents":
            documents,

        "total_documents":
            len(documents)
    }


# ==================================================
# DOCUMENT UPLOAD
# ==================================================

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="File name is missing."
        )

    filename = Path(
        file.filename
    ).name

    extension = Path(
        filename
    ).suffix.lower()

    if extension not in SUPPORTED_FILES:

        raise HTTPException(
            status_code=400,

            detail=(
                "Only PDF, TXT, MD "
                "and PY files are supported."
            )
        )

    file_path = (
        DOCUMENTS_FOLDER
        / filename
    )

    contents = await file.read()

    file_path.write_bytes(
        contents
    )

    text = read_document(
        file_path
    )

    if not text.strip():

        raise HTTPException(
            status_code=400,

            detail=(
                "No readable text was found "
                "inside this document."
            )
        )

    chunks = create_chunks(
        text
    )

    if not chunks:

        raise HTTPException(
            status_code=400,
            detail="No chunks were created."
        )

    embeddings = (
        embedding_model
        .encode(chunks)
        .tolist()
    )

    collection.delete(
        where={
            "source":
                filename
        }
    )

    ids = [

        create_chunk_id(
            filename,
            index
        )

        for index
        in range(
            len(chunks)
        )
    ]

    metadatas = [

        {
            "source":
                filename,

            "chunk":
                index
        }

        for index
        in range(
            len(chunks)
        )
    ]

    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return {
        "message":
            "Document uploaded successfully.",

        "filename":
            filename,

        "chunks_created":
            len(chunks),

        "total_chunks":
            collection.count()
    }


# ==================================================
# ADVANCED RAG
# ==================================================

@app.post("/ask")
def ask(
    request: QuestionRequest
):

    question = (
        request.question
        .strip()
    )

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    results = retrieve(
        query=question,
        final_k=4
    )

    if not results:

        return {
            "answer":
                (
                    "I could not find relevant "
                    "information in the "
                    "Knowledge Vault."
                ),

            "sources":
                [],

            "retrieval": {
                "status":
                    "no_results"
            }
        }

    best_reranker_score = (
        results[0].get(
            "reranker_score",
            -100
        )
    )

    if (
        best_reranker_score
        < RERANKER_MIN_SCORE
    ):

        return {
            "answer":
                (
                    "I don't have enough relevant "
                    "information in the Knowledge "
                    "Vault to answer that confidently."
                ),

            "sources":
                [],

            "retrieval": {
                "status":
                    "low_relevance",

                "best_reranker_score":
                    round(
                        best_reranker_score,
                        3
                    )
            }
        }

    context_parts = []

    sources = []

    for result in results:

        document = result[
            "document"
        ]

        metadata = result[
            "metadata"
        ]

        source = metadata.get(
            "source",
            "Unknown"
        )

        chunk = metadata.get(
            "chunk",
            "Unknown"
        )

        context_parts.append(
            f"""
SOURCE: {source}
CHUNK: {chunk}

{document}
"""
        )

        sources.append(
            {
                "source":
                    source,

                "chunk":
                    chunk,

                "passage":
                    document,

                "semantic_rank":
                    result.get(
                        "semantic_rank"
                    ),

                "keyword_rank":
                    result.get(
                        "keyword_rank"
                    ),

                "fusion_score":
                    round(
                        result.get(
                            "fusion_score",
                            0
                        ),
                        5
                    ),

                "reranker_score":
                    round(
                        result.get(
                            "reranker_score",
                            0
                        ),
                        3
                    )
            }
        )

    context = "\n\n".join(
        context_parts
    )

    prompt = f"""
You are InterviewForge AI.

Answer the question using ONLY the
retrieved Knowledge Vault context.

RULES:

1. Do not invent facts.
2. Do not use outside knowledge.
3. Combine relevant evidence when useful.
4. If context is insufficient, say so.
5. Give a clear technical answer.
6. Be concise unless detail is needed.

CONTEXT:

{context}

QUESTION:

{question}

ANSWER:
"""

    answer = ask_ollama(
        prompt,
        num_predict=350
    )

    return {
        "answer":
            answer,

        "sources":
            sources,

        "retrieval": {

            "method":
                (
                    "Semantic + BM25 + RRF "
                    "+ Cross-Encoder"
                ),

            "candidates_used":
                len(results),

            "best_reranker_score":
                round(
                    best_reranker_score,
                    3
                )
        }
    }


# ==================================================
# DOCUMENT SUMMARIZATION
# ==================================================

@app.post("/summarize")
def summarize_document(
    request: SummarizeRequest
):

    source = (
        request.source
        .strip()
    )

    if not source:

        raise HTTPException(
            status_code=400,

            detail=(
                "Document source "
                "cannot be empty."
            )
        )

    data = collection.get(
        where={
            "source":
                source
        },

        include=[
            "documents",
            "metadatas"
        ]
    )

    documents = data[
        "documents"
    ]

    metadatas = data[
        "metadatas"
    ]

    if not documents:

        raise HTTPException(
            status_code=404,

            detail=(
                "Document was not found "
                "in the Knowledge Vault."
            )
        )

    combined = list(
        zip(
            documents,
            metadatas
        )
    )

    combined.sort(
        key=lambda item:
        item[1].get(
            "chunk",
            0
        )
    )

    ordered_documents = [
        item[0]
        for item
        in combined
    ]

    # ----------------------------------------------
    # SMALL DOCUMENT
    # ----------------------------------------------

    if (
        len(ordered_documents)
        <= FAST_SUMMARY_MAX_CHUNKS
    ):

        full_text = "\n\n".join(
            ordered_documents
        )

        prompt = f"""
You are InterviewForge AI.

Summarize this document accurately.

DOCUMENT:
{source}

RULES:

1. Use only this document.
2. Do not invent information.
3. Preserve important technologies.
4. Preserve projects and achievements.
5. Preserve technical skills.
6. Preserve important numbers.
7. Remove unnecessary repetition.
8. Make the summary useful for interview preparation.

DOCUMENT CONTENT:

{full_text}

SUMMARY:
"""

        summary = ask_ollama(
            prompt,
            num_predict=450
        )

        return {
            "source":
                source,

            "summary":
                summary,

            "chunks_processed":
                len(
                    ordered_documents
                ),

            "summary_batches":
                1,

            "method":
                "fast single-pass summarization"
        }

    # ----------------------------------------------
    # LARGE DOCUMENT
    # ----------------------------------------------

    partial_summaries = []

    for start in range(
        0,
        len(ordered_documents),
        SUMMARY_BATCH_SIZE
    ):

        batch = ordered_documents[
            start:
            start
            + SUMMARY_BATCH_SIZE
        ]

        batch_text = "\n\n".join(
            batch
        )

        map_prompt = f"""
Summarize this section of:

{source}

Use only the supplied text.

Keep important facts, concepts,
technologies, projects, achievements,
and technical details.

TEXT:

{batch_text}

SECTION SUMMARY:
"""

        section_summary = ask_ollama(
            map_prompt,
            num_predict=250
        )

        partial_summaries.append(
            section_summary
        )

    combined_summaries = (
        "\n\n".join(
            partial_summaries
        )
    )

    final_prompt = f"""
Create one final summary of:

{source}

Combine the section summaries below.

RULES:

1. Do not invent information.
2. Remove repetition.
3. Preserve important technical details.
4. Make the summary clear.
5. Use structured bullet points when helpful.

SECTION SUMMARIES:

{combined_summaries}

FINAL SUMMARY:
"""

    final_summary = ask_ollama(
        final_prompt,
        num_predict=450
    )

    return {
        "source":
            source,

        "summary":
            final_summary,

        "chunks_processed":
            len(
                ordered_documents
            ),

        "summary_batches":
            len(
                partial_summaries
            ),

        "method":
            "map-reduce summarization"
    }


# ==================================================
# CODING GYM - LIST EXERCISES
# ==================================================

@app.get("/coding/exercises")
def coding_exercises():

    return {
        "exercises":
            get_exercises()
    }


# ==================================================
# CODING GYM - ONE EXERCISE
# ==================================================

@app.get(
    "/coding/exercises/{exercise_id}"
)
def coding_exercise(
    exercise_id: str
):

    exercise = get_exercise(
        exercise_id
    )

    if not exercise:

        raise HTTPException(
            status_code=404,
            detail="Exercise not found."
        )

    return {
        "id":
            exercise["id"],

        "title":
            exercise["title"],

        "topic":
            exercise["topic"],

        "difficulty":
            exercise["difficulty"],

        "description":
            exercise["description"],

        "starter_code":
            exercise["starter_code"]
    }


# ==================================================
# CODING GYM - SUBMIT
# ==================================================

@app.post("/coding/submit")
def submit_coding_exercise(
    request: CodingSubmissionRequest
):

    exercise_id = (
        request.exercise_id
        .strip()
    )

    code = (
        request.code
    )

    if not exercise_id:

        raise HTTPException(
            status_code=400,
            detail="Exercise ID is required."
        )

    if not code.strip():

        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty."
        )

    result = evaluate_submission(
        exercise_id=exercise_id,
        code=code
    )

    if "error" in result:

        raise HTTPException(
            status_code=404,
            detail=result["error"]
        )

    return result


# ==================================================
# INTERVIEW LAB - OPTIONS
# ==================================================

@app.get("/interview/options")
def interview_options():

    return {
        "topics":
            VALID_TOPICS,

        "difficulties":
            VALID_DIFFICULTIES
    }


# ==================================================
# INTERVIEW LAB - QUESTION
# ==================================================

@app.post("/interview/question")
def interview_question_endpoint(
    request: InterviewQuestionRequest
):

    topic = (
        request.topic
        .strip()
    )

    difficulty = (
        request.difficulty
        .strip()
    )

    if topic not in VALID_TOPICS:

        raise HTTPException(
            status_code=400,
            detail="Invalid interview topic."
        )

    if difficulty not in VALID_DIFFICULTIES:

        raise HTTPException(
            status_code=400,
            detail="Invalid interview difficulty."
        )

    result = get_interview_question(
        topic=topic,
        difficulty=difficulty,
        previous_questions=request.previous_questions
    )

    if "error" in result:

        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )

    return result


# ==================================================
# INTERVIEW LAB - EVALUATE
# ==================================================

@app.post("/interview/evaluate")
def interview_evaluate(
    request: InterviewEvaluationRequest
):

    topic = (
        request.topic
        .strip()
    )

    difficulty = (
        request.difficulty
        .strip()
    )

    question = (
        request.question
        .strip()
    )

    answer = (
        request.answer
        .strip()
    )

    if topic not in VALID_TOPICS:

        raise HTTPException(
            status_code=400,
            detail="Invalid interview topic."
        )

    if difficulty not in VALID_DIFFICULTIES:

        raise HTTPException(
            status_code=400,
            detail="Invalid interview difficulty."
        )

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Interview question cannot be empty."
        )

    if not answer:

        raise HTTPException(
            status_code=400,
            detail="Interview answer cannot be empty."
        )

    result = evaluate_interview_answer(
        topic=topic,
        difficulty=difficulty,
        question=question,
        answer=answer
    )

    if "error" in result:

        raise HTTPException(
            status_code=503,
            detail=result["error"]
        )

    return result


# ==================================================
# PROGRESS DASHBOARD
# ==================================================

@app.get("/progress/dashboard")
def progress_dashboard():

    try:

        dashboard = get_dashboard()

        return dashboard

    except Exception as error:

        raise HTTPException(
            status_code=500,

            detail=(
                "Could not load progress dashboard: "
                + str(error)
            )
        )