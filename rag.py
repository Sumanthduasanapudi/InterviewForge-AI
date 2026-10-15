import json
import urllib.request

import chromadb
from sentence_transformers import SentenceTransformer, util


# Load local embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


# Connect to persistent ChromaDB
client = chromadb.PersistentClient(path="chroma_db")

collection = client.get_collection(
    name="interviewforge_notes"
)


def ask_ollama(prompt):
    """Send a prompt to the local Ollama model."""

    data = {
        "model": "llama3.2:3b",
        "prompt": prompt,
        "stream": False
    }

    request = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    with urllib.request.urlopen(request) as response:
        result = json.loads(
            response.read().decode("utf-8")
        )

    return result["response"]


print("InterviewForge AI - Local RAG")
print("Type 'exit' to stop.\n")


while True:

    question = input("You: ").strip()

    if question.lower() == "exit":
        print("Goodbye!")
        break

    if not question:
        continue


    # Convert question to embedding
    question_embedding = embedding_model.encode(
        [question]
    ).tolist()


    # Search across all documents
    results = collection.query(
        query_embeddings=question_embedding,
        n_results=3,
        include=["documents", "metadatas"]
    )


    documents = results["documents"][0]
    metadatas = results["metadatas"][0]


    if not documents:
        print("\nAI: No documents were found.\n")
        continue


    # Check semantic similarity
    document_embeddings = embedding_model.encode(
        documents
    )

    question_vector = embedding_model.encode(
        question
    )

    similarities = util.cos_sim(
        question_vector,
        document_embeddings
    )[0]

    best_score = float(similarities.max())


    # Reject unrelated questions
    if best_score < 0.30:
        print(
            "\nAI: I don't have enough information "
            "in the Knowledge Vault to answer that."
        )

        print(
            "Best retrieval score:",
            round(best_score, 3)
        )

        print()

        continue


    # Build context with source information
    context_parts = []

    for document, metadata in zip(
        documents,
        metadatas
    ):

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
Source: {source}
Chunk: {chunk}

{document}
"""
        )


    context = "\n".join(context_parts)


    prompt = f"""
You are InterviewForge AI, a local RAG assistant.

Answer the user's question using only the provided context.

Rules:

1. Do not invent information.
2. If the context is insufficient, clearly say so.
3. Give a clear and concise answer.
4. Do not claim that retrieved information is guaranteed to be correct.
5. Base your answer only on the Knowledge Vault context.

Knowledge Vault Context:

{context}

User Question:

{question}

Answer:
"""


    answer = ask_ollama(prompt)


    print("\nAI:")
    print(answer)


    print("\nSources:")

    for document, metadata in zip(
        documents,
        metadatas
    ):

        print(
            f"\n{metadata.get('source', 'Unknown')}"
            f" | chunk {metadata.get('chunk', '?')}"
        )

        print(document[:300])


    print(
        "\nBest retrieval score:",
        round(best_score, 3)
    )

    print("\n" + "-" * 60 + "\n")