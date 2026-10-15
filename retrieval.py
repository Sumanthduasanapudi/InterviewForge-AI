import re

import chromadb
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder


# --------------------------------------------------
# Local embedding model
# --------------------------------------------------

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# --------------------------------------------------
# Local reranker model
# --------------------------------------------------

reranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)


# --------------------------------------------------
# Connect to ChromaDB
# --------------------------------------------------

client = chromadb.PersistentClient(
    path="chroma_db"
)

collection = client.get_collection(
    name="interviewforge_notes"
)


# --------------------------------------------------
# Tokenizer for BM25
# --------------------------------------------------

def tokenize(text):
    return re.findall(
        r"\b\w+\b",
        text.lower()
    )


# --------------------------------------------------
# Hybrid retrieval
# --------------------------------------------------

def hybrid_search(
    query,
    semantic_k=10,
    keyword_k=10,
    final_k=10
):

    total_chunks = collection.count()

    if total_chunks == 0:
        return []


    # ----------------------------------------------
    # Semantic search
    # ----------------------------------------------

    query_embedding = embedding_model.encode(
        [query]
    ).tolist()


    semantic_results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(
            semantic_k,
            total_chunks
        ),
        include=[
            "documents",
            "metadatas"
        ]
    )


    semantic_ids = semantic_results["ids"][0]

    semantic_documents = semantic_results[
        "documents"
    ][0]

    semantic_metadatas = semantic_results[
        "metadatas"
    ][0]


    # ----------------------------------------------
    # Get all chunks for BM25
    # ----------------------------------------------

    all_data = collection.get(
        include=[
            "documents",
            "metadatas"
        ]
    )


    all_ids = all_data["ids"]

    all_documents = all_data["documents"]

    all_metadatas = all_data["metadatas"]


    # ----------------------------------------------
    # BM25 keyword search
    # ----------------------------------------------

    tokenized_documents = [
        tokenize(document)
        for document in all_documents
    ]


    bm25 = BM25Okapi(
        tokenized_documents
    )


    query_tokens = tokenize(
        query
    )


    bm25_scores = bm25.get_scores(
        query_tokens
    )


    ranked_keyword_indexes = sorted(
        range(len(bm25_scores)),
        key=lambda index: bm25_scores[index],
        reverse=True
    )[:keyword_k]


    # ----------------------------------------------
    # Reciprocal Rank Fusion
    # ----------------------------------------------

    candidates = {}

    RRF_K = 60


    # Semantic results
    for rank, (
        chunk_id,
        document,
        metadata
    ) in enumerate(
        zip(
            semantic_ids,
            semantic_documents,
            semantic_metadatas
        ),
        start=1
    ):

        candidates[chunk_id] = {
            "id": chunk_id,
            "document": document,
            "metadata": metadata,
            "semantic_rank": rank,
            "keyword_rank": None,
            "fusion_score": (
                1 / (RRF_K + rank)
            )
        }


    # BM25 results
    for rank, index in enumerate(
        ranked_keyword_indexes,
        start=1
    ):

        chunk_id = all_ids[index]

        if chunk_id not in candidates:

            candidates[chunk_id] = {
                "id": chunk_id,
                "document": all_documents[index],
                "metadata": all_metadatas[index],
                "semantic_rank": None,
                "keyword_rank": rank,
                "fusion_score": 0
            }


        candidates[chunk_id][
            "keyword_rank"
        ] = rank


        candidates[chunk_id][
            "fusion_score"
        ] += (
            1 / (RRF_K + rank)
        )


    # ----------------------------------------------
    # Sort by fusion score
    # ----------------------------------------------

    ranked_results = sorted(
        candidates.values(),
        key=lambda item: item[
            "fusion_score"
        ],
        reverse=True
    )


    return ranked_results[:final_k]


# --------------------------------------------------
# Cross-encoder reranking
# --------------------------------------------------

def rerank_results(
    query,
    results,
    final_k=4
):

    if not results:
        return []


    pairs = [
        [
            query,
            result["document"]
        ]
        for result in results
    ]


    scores = reranker.predict(
        pairs
    )


    for result, score in zip(
        results,
        scores
    ):

        result[
            "reranker_score"
        ] = float(score)


    ranked_results = sorted(
        results,
        key=lambda item: item[
            "reranker_score"
        ],
        reverse=True
    )


    return ranked_results[:final_k]


# --------------------------------------------------
# Full advanced retrieval pipeline
# --------------------------------------------------

def retrieve(
    query,
    final_k=4
):

    hybrid_results = hybrid_search(
        query=query,
        semantic_k=10,
        keyword_k=10,
        final_k=10
    )


    reranked_results = rerank_results(
        query=query,
        results=hybrid_results,
        final_k=final_k
    )


    return reranked_results


# --------------------------------------------------
# Test
# --------------------------------------------------

if __name__ == "__main__":

    question = input(
        "Ask the Knowledge Vault: "
    ).strip()


    if not question:

        print(
            "Please enter a question."
        )

        raise SystemExit


    results = retrieve(
        question,
        final_k=4
    )


    if not results:

        print(
            "\nNo results found."
        )

        raise SystemExit


    print(
        "\nADVANCED RAG RETRIEVAL RESULTS"
    )


    for number, result in enumerate(
        results,
        start=1
    ):

        metadata = result[
            "metadata"
        ]


        print(
            f"\n{'=' * 60}"
        )

        print(
            f"Result {number}"
        )

        print(
            f"{'=' * 60}"
        )


        print(
            "Source:",
            metadata.get(
                "source",
                "Unknown"
            )
        )


        print(
            "Chunk:",
            metadata.get(
                "chunk",
                "Unknown"
            )
        )


        print(
            "Semantic rank:",
            result.get(
                "semantic_rank"
            )
        )


        print(
            "Keyword rank:",
            result.get(
                "keyword_rank"
            )
        )


        print(
            "Fusion score:",
            round(
                result.get(
                    "fusion_score",
                    0
                ),
                5
            )
        )


        print(
            "Reranker score:",
            round(
                result.get(
                    "reranker_score",
                    0
                ),
                3
            )
        )


        print(
            "\nPassage:\n"
        )


        print(
            result["document"]
        )