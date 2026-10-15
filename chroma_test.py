import chromadb
from sentence_transformers import SentenceTransformer

# Load local embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Read our document
with open("notes.txt", "r", encoding="utf-8") as file:
    text = file.read()

# Each non-empty line becomes a chunk
chunks = [line for line in text.split("\n") if line.strip()]

# Convert chunks into embeddings
embeddings = model.encode(chunks).tolist()

# Create a persistent local ChromaDB database
client = chromadb.PersistentClient(path="chroma_db")

collection = client.get_or_create_collection(
    name="interviewforge_notes"
)

# Store chunks + vectors + source information
collection.upsert(
    ids=[f"chunk_{i}" for i in range(len(chunks))],
    documents=chunks,
    embeddings=embeddings,
    metadatas=[{"source": "notes.txt"} for _ in chunks],
)

# Test semantic search
question = "What does RAG do?"

question_embedding = model.encode([question]).tolist()

results = collection.query(
    query_embeddings=question_embedding,
    n_results=2
)

print("Question:", question)

for document in results["documents"][0]:
    print("\nRetrieved:")
    print(document)