"""Experiment 3 - NumPy vector search.

Persistence layout (one folder per document):
    vector_indexes/doc_<id>/embeddings.npy        raw vectors (Experiment 2 output)
    vector_indexes/doc_<id>/embeddings_info.json  model name, dimension
    vector_indexes/doc_<id>/index.npy             searchable vector matrix
    vector_indexes/doc_<id>/meta.json             chunk_index / page / text per vector
JSON is used for metadata (not pickle) so loading a tampered file cannot run code.
"""
import json
import shutil
from pathlib import Path

import numpy as np

INDEX_FILE = "index.npy"
META_FILE = "meta.json"
EMB_FILE = "embeddings.npy"
EMB_INFO = "embeddings_info.json"


def index_dir_for(doc_id):
    from django.conf import settings
    return Path(settings.VECTOR_INDEX_DIR) / f"doc_{doc_id}"


def remove_index_dir(doc_id):
    shutil.rmtree(index_dir_for(doc_id), ignore_errors=True)


class VectorStore:
    def __init__(self, directory=None):
        self.directory = Path(directory) if directory else None
        self.index = None
        self.documents = []      # row i of the matrix <-> documents[i]
        self.model_name = None

    def create_index(self, embeddings, chunks, model_name=None):
        embeddings = np.ascontiguousarray(embeddings, dtype="float32")
        if embeddings.ndim != 2 or len(embeddings) != len(chunks):
            raise ValueError("Embeddings and chunks must have the same length")
        self.index = embeddings
        self.documents = list(chunks)
        self.model_name = model_name
        return len(self.index)

    def search(self, query_embedding, k=5):
        """similarity_search: returns top-k [{rank, score, page, chunk_index, content}]."""
        if self.index is None:
            raise ValueError("Vector index is not initialized")
        query = np.asarray(query_embedding, dtype="float32")
        if query.ndim != 2 or query.shape != (1, self.index.shape[1]):
            raise ValueError("Query embedding must have shape (1, embedding_dimension)")
        k = min(k, len(self.index))
        if k == 0:
            return []
        scores = self.index @ query[0]
        ids = np.argsort(-scores, kind="stable")[:k]
        results = []
        for rank, idx in enumerate(ids, start=1):
            score = scores[idx]
            doc = self.documents[idx]
            results.append({
                "rank": rank, "score": round(float(score), 4), "page": doc["page"],
                "chunk_index": doc["chunk_index"], "content": doc["content"],
            })
        return results

    def save(self, directory=None):
        directory = Path(directory or self.directory)
        directory.mkdir(parents=True, exist_ok=True)
        if self.index is None:
            raise ValueError("Vector index is not initialized")
        np.save(directory / INDEX_FILE, self.index, allow_pickle=False)
        (directory / META_FILE).write_text(
            json.dumps({"model_name": self.model_name, "documents": self.documents}), encoding="utf-8")
        self.directory = directory

    def load(self, directory=None):
        directory = Path(directory or self.directory)
        index_path, meta_path = directory / INDEX_FILE, directory / META_FILE
        if not (index_path.exists() and meta_path.exists()):
            return False
        index = np.load(index_path, allow_pickle=False)
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        if index.ndim != 2 or len(index) != len(meta["documents"]):
            raise ValueError("Vector index and metadata do not match")
        self.index = index
        self.documents, self.model_name = meta["documents"], meta.get("model_name")
        self.directory = directory
        return True
