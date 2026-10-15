from pathlib import Path

import chromadb


# Possible ChromaDB locations in your project
DATABASE_PATHS = [
    Path("./chroma_db"),
    Path("./documents/chroma_db"),
]


def get_collection_name(collection):
    """
    Works with different ChromaDB versions where list_collections()
    may return either collection objects or names.
    """
    if isinstance(collection, str):
        return collection

    return collection.name


def find_database():
    print("=" * 60)
    print("InterviewForge AI - Finding ChromaDB")
    print("=" * 60)

    for database_path in DATABASE_PATHS:

        print(f"\nChecking database:")
        print(database_path.resolve())

        if not database_path.exists():
            print("Database folder does not exist.")
            continue

        try:
            client = chromadb.PersistentClient(
                path=str(database_path)
            )

            collections = client.list_collections()

            if not collections:
                print("No collections found here.")
                continue

            for collection_info in collections:

                collection_name = get_collection_name(
                    collection_info
                )

                collection = client.get_collection(
                    name=collection_name
                )

                count = collection.count()

                print(
                    f"Collection: {collection_name}"
                )
                print(
                    f"Documents stored: {count}"
                )

                if count > 0:

                    print("\n✅ Found your populated database!")
                    print(
                        f"Using: {database_path.resolve()}"
                    )
                    print(
                        f"Collection: {collection_name}"
                    )

                    return collection

        except Exception as error:
            print(
                f"Could not read database: {error}"
            )

    return None


def search(collection, question):

    number_of_documents = collection.count()

    if number_of_documents == 0:
        print("\nDatabase is empty.")
        return

    # Never request more documents than exist
    number_of_results = min(
        3,
        number_of_documents
    )

    results = collection.query(
        query_texts=[question],
        n_results=number_of_results
    )

    documents = results.get(
        "documents",
        [[]]
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]]
    )[0]

    distances = results.get(
        "distances",
        [[]]
    )[0]

    print("\n" + "=" * 60)
    print("QUESTION")
    print("=" * 60)

    print(question)

    print("\n" + "=" * 60)
    print("RELEVANT CHUNKS")
    print("=" * 60)

    if not documents:
        print("No matching documents found.")
        return

    for index, document in enumerate(
        documents,
        start=1
    ):

        print(
            f"\n--- RESULT {index} ---"
        )

        metadata_index = index - 1

        if metadata_index < len(metadatas):

            metadata = metadatas[
                metadata_index
            ]

            if metadata:

                source = metadata.get(
                    "source",
                    "Unknown"
                )

                print(
                    f"Source: {source}"
                )

        if metadata_index < len(distances):

            print(
                f"Distance: "
                f"{distances[metadata_index]:.4f}"
            )

        print()

        print(document)


def main():

    collection = find_database()

    if collection is None:

        print("\n" + "=" * 60)

        print("❌ Could not find your 10 stored chunks.")

        print("=" * 60)

        print(
            "\nSend me your ingest.py file "
            "and I will fix the database paths."
        )

        return

    print("\n" + "=" * 60)

    print("InterviewForge AI - Resume Search")

    print("=" * 60)

    while True:

        question = input(
            "\nAsk something about your resume "
            "(type 'exit' to stop): "
        ).strip()

        if question.lower() in {
            "exit",
            "quit"
        }:

            print("\nGoodbye!")

            break

        if not question:
            continue

        search(
            collection,
            question
        )


if __name__ == "__main__":
    main()