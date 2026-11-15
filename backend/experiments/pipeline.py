"""Run all four experiments sequentially from a script (no Django DB needed).

Usage (from backend/):
    python -c "from experiments.pipeline import run_complete_pipeline as r; print(r('sample.pdf','What is water for?'))"
"""
from pathlib import Path

from experiments.embedding_generator import EmbeddingGenerator
from experiments.pdf_processor import load_and_split_pdf
from experiments.rag_engine import RAGEngine
from experiments.vector_store import VectorStore


def run_complete_pipeline(pdf_path, question, work_dir="vector_index", chunk_size=1000, overlap=200):
    print("Experiment 1: Processing PDF...")
    result = load_and_split_pdf(pdf_path, chunk_size, overlap)
    chunks = [{**c, "chunk_index": i} for i, c in enumerate(result["chunks"])]

    print("Experiment 2: Generating embeddings...")
    generator = EmbeddingGenerator()
    embeddings = generator.generate_embeddings(chunks)

    print("Experiment 3: Creating vector database...")
    store = VectorStore(Path(work_dir))
    store.create_index(embeddings, chunks, generator.model_name)
    store.save()
    retrieved = store.search(generator.embed_query(question), k=4)

    print("Experiment 4: Asking Gemini...")
    answer = RAGEngine().generate_answer(question, retrieved)
    return {"total_pages": result["total_pages"], "total_chunks": len(chunks), **answer}
