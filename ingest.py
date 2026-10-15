from pathlib import Path

import chromadb
from pypdf import PdfReader


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DOCUMENTS_FOLDER = BASE_DIR / "documents"

CHROMA_PATH = BASE_DIR / "chroma_db"

COLLECTION_NAME = "interview_knowledge"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text_from_pdf(pdf_path):
    """
    Extract text from every readable page of a PDF.
    """

    reader = PdfReader(str(pdf_path))

    text_parts = []

    for page_number, page in enumerate(
        reader.pages,
        start=1
    ):
        text = page.extract_text()

        if text:
            text_parts.append(text)

    return "\n".join(text_parts)


# ============================================================
# TEXT CHUNKING
# ============================================================

def split_text(text):
    """
    Split text into overlapping chunks.
    """

    chunks = []

    start = 0

    while start < len(text):

        end = start + CHUNK_SIZE

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += (
            CHUNK_SIZE - CHUNK_OVERLAP
        )

    return chunks


# ============================================================
# MAIN INGESTION
# ============================================================

def main():

    print("=" * 65)
    print("InterviewForge AI - Document Ingestion")
    print("=" * 65)

    print(f"\nProject folder:")
    print(BASE_DIR)

    print(f"\nDocuments folder:")
    print(DOCUMENTS_FOLDER)

    print(f"\nChromaDB folder:")
    print(CHROMA_PATH)

    print(f"\nCollection:")
    print(COLLECTION_NAME)

    # --------------------------------------------------------
    # CHECK DOCUMENTS FOLDER
    # --------------------------------------------------------

    if not DOCUMENTS_FOLDER.exists():

        DOCUMENTS_FOLDER.mkdir(
            parents=True,
            exist_ok=True
        )

        print(
            "\nDocuments folder was created."
        )

        print(
            "Put your PDF inside the documents folder."
        )

        return

    pdf_files = list(
        DOCUMENTS_FOLDER.glob("*.pdf")
    )

    if not pdf_files:

        print("\nERROR: No PDF files found.")

        print(
            f"Put your PDF inside:\n"
            f"{DOCUMENTS_FOLDER}"
        )

        return

    print(
        f"\nPDF files found: {len(pdf_files)}"
    )

    # --------------------------------------------------------
    # CONNECT TO CHROMADB
    # --------------------------------------------------------

    client = chromadb.PersistentClient(
        path=str(CHROMA_PATH)
    )

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME
    )

    # --------------------------------------------------------
    # PROCESS PDFs
    # --------------------------------------------------------

    total_added = 0

    for pdf_path in pdf_files:

        print("\n" + "-" * 65)

        print(
            f"Processing: {pdf_path.name}"
        )

        try:

            text = extract_text_from_pdf(
                pdf_path
            )

            if not text.strip():

                print(
                    "No readable text found."
                )

                continue

            chunks = split_text(text)

            print(
                f"Created {len(chunks)} chunks"
            )

            ids = []
            documents = []
            metadatas = []

            for index, chunk in enumerate(
                chunks
            ):

                # Unique ID using file name and chunk number
                chunk_id = (
                    f"{pdf_path.stem}_chunk_{index}"
                )

                ids.append(chunk_id)

                documents.append(chunk)

                metadatas.append(
                    {
                        "source": pdf_path.name,
                        "chunk": index
                    }
                )

            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )

            total_added += len(chunks)

            print(
                "Stored in ChromaDB."
            )

        except Exception as error:

            print(
                f"ERROR processing "
                f"{pdf_path.name}:"
            )

            print(error)

    # --------------------------------------------------------
    # FINAL DATABASE CHECK
    # --------------------------------------------------------

    database_count = collection.count()

    print("\n" + "=" * 65)
    print("INGESTION COMPLETE")
    print("=" * 65)

    print(
        f"Chunks processed this run: "
        f"{total_added}"
    )

    print(
        f"Total chunks in database: "
        f"{database_count}"
    )

    print(
        f"Collection: "
        f"{COLLECTION_NAME}"
    )

    print(
        f"Database location:\n"
        f"{CHROMA_PATH}"
    )

    print("=" * 65)


if __name__ == "__main__":
    main()