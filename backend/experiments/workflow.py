"""Service layer: runs each experiment against an UploadedDocument and records results."""
import json
import time
from contextlib import contextmanager

import numpy as np
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from documents.models import UploadedDocument
from services.errors import ServiceError
from .embedding_generator import DEFAULT_MODEL, get_embedding_generator
from .models import DocumentChunk, ExperimentRun
from .pdf_processor import extract_pages, load_and_split_pdf
from .vector_store import (EMB_FILE, EMB_INFO, INDEX_FILE, META_FILE, VectorStore,
                           index_dir_for, remove_index_dir)

Status = UploadedDocument.Status


def set_status(doc, status):
    doc.status = status
    doc.error_message = ""
    doc.save(update_fields=["status", "error_message", "updated_at"])


@contextmanager
def tracked_run(doc, experiment, params=None):
    """Create an ExperimentRun row, mark it completed/failed, always stamp finished_at."""
    run = ExperimentRun.objects.create(document=doc, experiment=experiment, parameters=params or {})
    try:
        yield run
        run.status = ExperimentRun.Status.COMPLETED
    except ServiceError as exc:
        run.status, run.error_message = ExperimentRun.Status.FAILED, exc.message
        raise
    except Exception as exc:
        run.status, run.error_message = ExperimentRun.Status.FAILED, str(exc)
        raise ServiceError(f"Experiment {experiment} failed: {exc}", 500) from exc
    finally:
        run.finished_at = timezone.now()
        run.save()


def chunk_dict(c):
    return {"chunk_index": c.chunk_index, "page": c.page_number,
            "content": c.content, "char_count": c.char_count}


# ---------------- Experiment 1 ----------------
def run_extraction(doc):
    with tracked_run(doc, 1, {"step": "extract"}) as run:
        data = extract_pages(doc.file.path)
        if doc.status == Status.UPLOADED:
            set_status(doc, Status.EXTRACTED)
        run.results = {"total_pages": data["total_pages"],
                       "total_chars": sum(p["char_count"] for p in data["pages"])}
    return {"document": doc.title, **data}


def run_chunking(doc, chunk_size, overlap):
    params = {"step": "chunk", "chunk_size": chunk_size, "chunk_overlap": overlap}
    with tracked_run(doc, 1, params) as run:
        result = load_and_split_pdf(doc.file.path, chunk_size, overlap)
        if not result["chunks"]:
            raise ServiceError("No extractable text found (is this a scanned, image-only PDF?).", 422)
        rows = [DocumentChunk(document=doc, chunk_index=i, page_number=c["page"],
                              content=c["content"], char_count=len(c["content"]))
                for i, c in enumerate(result["chunks"])]
        with transaction.atomic():
            doc.chunks.all().delete()
            DocumentChunk.objects.bulk_create(rows, batch_size=500)
        remove_index_dir(doc.id)  # old embeddings/index no longer match the new chunks
        set_status(doc, Status.CHUNKED)
        run.results = {"total_pages": result["total_pages"], "total_chunks": len(rows)}
    return chunks_payload(doc, chunk_size, overlap)


def chunks_payload(doc, chunk_size=None, overlap=None):
    chunks = [chunk_dict(c) for c in doc.chunks.all()]
    return {"document": doc.title, "total_pages": doc.page_count, "total_chunks": len(chunks),
            "chunk_size": chunk_size, "chunk_overlap": overlap, "chunks": chunks}


# ---------------- Experiment 2 ----------------
def _progress_key(doc_id):
    return f"embed_progress_{doc_id}"


def get_progress(doc):
    return cache.get(_progress_key(doc.id)) or {"done": 0, "total": 0, "percent": 0}


def run_embedding(doc, model_name=DEFAULT_MODEL):
    chunks = list(doc.chunks.all())
    if not chunks:
        raise ServiceError("No chunks found. Run Experiment 1 (chunking) first.", 409)

    def on_progress(done, total):
        cache.set(_progress_key(doc.id), {"done": done, "total": total,
                                          "percent": round(done * 100 / total)}, 600)

    on_progress(0, len(chunks))
    with tracked_run(doc, 2, {"model_name": model_name}) as run:
        generator = get_embedding_generator(model_name)
        started = time.time()
        embeddings = generator.generate_embeddings([{"content": c.content} for c in chunks],
                                                   progress_callback=on_progress)
        seconds = round(time.time() - started, 2)

        directory = index_dir_for(doc.id)
        directory.mkdir(parents=True, exist_ok=True)
        np.save(directory / EMB_FILE, embeddings)
        (directory / EMB_INFO).write_text(json.dumps(
            {"model_name": model_name, "dimension": int(embeddings.shape[1]),
             "total": int(embeddings.shape[0])}), encoding="utf-8")
        for stale in (INDEX_FILE, META_FILE):  # previous index is out of date
            (directory / stale).unlink(missing_ok=True)
        set_status(doc, Status.EMBEDDED)

        result = {
            "model_name": model_name, "total_embeddings": int(embeddings.shape[0]),
            "dimension": int(embeddings.shape[1]), "seconds": seconds,
            "sample_vector": [round(float(x), 5) for x in embeddings[0][:12]],
            "samples": [{"chunk_index": c.chunk_index, "page": c.page_number,
                         "preview": c.content[:120],
                         "values": [round(float(x), 5) for x in embeddings[i][:8]]}
                        for i, c in enumerate(chunks[:5])],
        }
        run.results = {k: result[k] for k in ("model_name", "total_embeddings", "dimension", "seconds")}
    return result


def embed_query_preview(model_name, query):
    vector = get_embedding_generator(model_name).embed_query(query)
    return {"query": query, "model_name": model_name, "dimension": int(vector.shape[1]),
            "norm": round(float(np.linalg.norm(vector[0])), 4),
            "sample_values": [round(float(x), 5) for x in vector[0][:12]]}


# ---------------- Experiment 3 ----------------
def run_indexing(doc):
    directory = index_dir_for(doc.id)
    if not (directory / EMB_FILE).exists():
        raise ServiceError("No embeddings found. Run Experiment 2 first.", 409)
    with tracked_run(doc, 3, {"step": "index"}) as run:
        embeddings = np.load(directory / EMB_FILE)
        info = json.loads((directory / EMB_INFO).read_text(encoding="utf-8"))
        chunks = [chunk_dict(c) for c in doc.chunks.all()]
        if len(chunks) != len(embeddings):
            raise ServiceError("Chunks changed since embedding. Re-run Experiment 2.", 409)
        store = VectorStore(directory)
        total = store.create_index(embeddings, chunks, info["model_name"])
        store.save()
        set_status(doc, Status.INDEXED)
        result = {"total_vectors": total, "dimension": int(embeddings.shape[1]),
                  "index_type": "NumPy exact search (cosine similarity on normalized vectors)",
                  "model_name": info["model_name"],
                  "index_size_kb": round((directory / INDEX_FILE).stat().st_size / 1024, 1)}
        run.results = result
    return result


def load_store(doc):
    store = VectorStore(index_dir_for(doc.id))
    if not store.load():
        raise ServiceError("This document has no search index yet. Run Experiment 3 first.", 409)
    return store


def run_search(doc, query, k=5):
    store = load_store(doc)
    with tracked_run(doc, 3, {"step": "search", "query": query, "k": k}) as run:
        vector = get_embedding_generator(store.model_name or DEFAULT_MODEL).embed_query(query)
        results = store.search(vector, k=k)
        run.results = {"returned": len(results), "top_score": results[0]["score"] if results else None}
    return {"query": query, "k": k, "results": results}
