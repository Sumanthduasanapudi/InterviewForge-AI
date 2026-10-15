from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

sentences = [
    "Python is a programming language.",
    "RAG retrieves relevant information before generating an answer.",
    "A dictionary stores key-value pairs."
]

embeddings = model.encode(sentences)

print("Number of sentences:", len(embeddings))
print("Embedding dimensions:", len(embeddings[0]))
print("First embedding preview:")
print(embeddings[0][:10])
