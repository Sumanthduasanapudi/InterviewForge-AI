import chromadb

# Create a local persistent ChromaDB database
client = chromadb.PersistentClient(path="./chroma_db")

# Create or load a collection
collection = client.get_or_create_collection(
    name="interview_knowledge"
)

# Add sample data
collection.upsert(
    ids=[
        "doc1",
        "doc2",
        "doc3"
    ],
    documents=[
        "Python is a high-level programming language.",
        "ChromaDB is a vector database commonly used in RAG applications.",
        "A linked list is a data structure where elements are connected using pointers."
    ]
)

# Search the database
results = collection.query(
    query_texts=["What database can be used for RAG?"],
    n_results=2
)

print("\nSearch Results:")
print("----------------")

for document in results["documents"][0]:
    print(document)