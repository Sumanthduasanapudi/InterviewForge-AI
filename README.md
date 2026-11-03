# InterviewForge AI

InterviewForge AI is a local-first AI interview preparation platform built for practical interview practice. It combines Retrieval-Augmented Generation (RAG), a candidate Knowledge Vault, mock technical interviews, answer evaluation, and a React interface.

## Features

- Upload PDF documents into a personal Knowledge Vault
- Extract and chunk document text for retrieval
- Store and retrieve knowledge with ChromaDB
- Ground answers in the candidate's uploaded information
- Run adaptive mock interview sessions
- Evaluate interview answers and provide structured feedback
- Practice study topics and interview concepts
- Run locally with Ollama instead of requiring a hosted LLM API
- React + Vite frontend with a FastAPI backend

## Architecture

```text
PDF Documents
     |
     v
Text Extraction (pypdf)
     |
     v
Chunking
     |
     v
ChromaDB Knowledge Vault
     |
     +-----------------------+
                             |
User Question ----------> Retrieval
                             |
                             v
                      Relevant Context
                             |
                             v
                     Prompt Construction
                             |
                             v
                   Ollama / llama3.2:3b
                             |
                             v
                      Grounded Answer

React / Vite Frontend <---- REST API ----> FastAPI Backend
```

## Tech Stack

**AI / RAG**
- Ollama
- Llama 3.2 3B
- ChromaDB
- Retrieval-Augmented Generation (RAG)
- PDF knowledge ingestion

**Backend**
- Python
- FastAPI
- Pydantic
- pypdf

**Frontend**
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

## Project Structure

```text
InterviewForge-AI/
|-- api.py                 # FastAPI application and AI endpoints
|-- rag.py                 # Local RAG workflow
|-- ingest.py              # Knowledge ingestion
|-- retrieval.py           # Retrieval logic
|-- query_chroma.py        # ChromaDB query utilities
|-- interview_lab.py       # Interview practice logic
|-- coding_gym.py          # Coding practice features
|-- progress.py            # Progress features
|-- database.py            # Application database utilities
|-- frontend/              # React + Vite frontend
|-- requirements.txt       # Python dependencies
`-- .gitignore
```

## Prerequisites

Install the following before running the project:

- Python 3.10+
- Node.js and npm
- Ollama

Pull the local model:

```bash
ollama pull llama3.2:3b
```

Make sure Ollama is running before using AI features.

## Backend Setup

Clone the repository and enter the project directory:

```bash
git clone https://github.com/Sumanthduasanapudi/InterviewForge-AI.git
cd InterviewForge-AI
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn api:app --reload
```

The local API will normally be available at `http://127.0.0.1:8000` and interactive FastAPI documentation at `http://127.0.0.1:8000/docs`.

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

For a production build check:

```bash
npm run build
```

## RAG Flow

### Indexing

```text
PDF -> text extraction -> chunking -> ChromaDB
```

### Query

```text
Question -> similarity retrieval -> relevant context -> prompt -> local LLM -> answer
```

The application instructs the model to ground candidate-specific answers in retrieved Knowledge Vault context and avoid inventing experience.

## Local LLM

The backend is configured to use Ollama at:

```text
http://localhost:11434/api/generate
```

with:

```text
llama3.2:3b
```

This means the AI generation layer can run locally without putting an external LLM API key in the repository.

## Security Notes

- Do not commit private resumes, personal documents, API keys, `.env` files, local vector databases, or virtual environments.
- Review uploaded documents before sharing a populated local Knowledge Vault.
- Keep secrets in environment variables if hosted services are added later.

## Portfolio Value

InterviewForge AI demonstrates hands-on experience with Python, FastAPI, React, REST APIs, RAG, document processing, vector retrieval, ChromaDB, prompt construction, local LLM integration, and AI application development.

## Author

**Dusanapudi Sumanth**  
Computer Science & Engineering — 2026  
AI / Generative AI Engineer
