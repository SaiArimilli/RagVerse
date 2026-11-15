"""Experiment 2 - MiniLM text embeddings using ONNX Runtime."""
import json
import threading

import numpy as np

DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
# Whitelist: the API must not let users make the server download arbitrary models.
ALLOWED_MODELS = [DEFAULT_MODEL, "sentence-transformers/paraphrase-MiniLM-L3-v2"]
_TOKENIZER_ATTRIBUTES = {
    "input_ids": "ids",
    "attention_mask": "attention_mask",
    "token_type_ids": "type_ids",
}


class EmbeddingGenerator:
    def __init__(self, model_name=DEFAULT_MODEL):
        import onnxruntime as ort
        from huggingface_hub import hf_hub_download
        from tokenizers import Tokenizer

        self.model_name = model_name
        config_path = hf_hub_download(model_name, "sentence_bert_config.json")
        pooling_config_path = hf_hub_download(model_name, "1_Pooling/config.json")
        tokenizer_path = hf_hub_download(model_name, "tokenizer.json")
        model_path = hf_hub_download(model_name, "onnx/model.onnx")

        with open(config_path, encoding="utf-8") as config_file:
            config = json.load(config_file)
        with open(pooling_config_path, encoding="utf-8") as config_file:
            pooling_config = json.load(config_file)

        self._dimension = int(pooling_config["word_embedding_dimension"])
        self._tokenizer = Tokenizer.from_file(tokenizer_path)
        self._tokenizer.enable_truncation(max_length=int(config["max_seq_length"]))
        pad_token = self._tokenizer.token_to_id("[PAD]")
        if pad_token is None:
            raise ValueError(f"Model {model_name} does not define a [PAD] token")
        self._tokenizer.enable_padding(pad_id=pad_token, pad_token="[PAD]")
        self._session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        self._input_names = [item.name for item in self._session.get_inputs()]
        self._output_name = self._session.get_outputs()[0].name

    @property
    def dimension(self):
        return self._dimension

    def _encode(self, texts):
        encodings = self._tokenizer.encode_batch(texts)
        inputs = {}
        for name in self._input_names:
            attribute = _TOKENIZER_ATTRIBUTES.get(name)
            if attribute is None:
                raise ValueError(f"Unsupported ONNX model input: {name}")
            inputs[name] = np.asarray(
                [getattr(encoding, attribute) for encoding in encodings],
                dtype=np.int64,
            )

        token_embeddings = self._session.run([self._output_name], inputs)[0]
        attention_mask = inputs["attention_mask"].astype(np.float32)[..., np.newaxis]
        pooled = (token_embeddings * attention_mask).sum(axis=1)
        pooled /= np.maximum(attention_mask.sum(axis=1), 1.0)
        norms = np.linalg.norm(pooled, axis=1, keepdims=True)
        return (pooled / np.maximum(norms, np.finfo(np.float32).tiny)).astype(np.float32)

    def generate_embeddings(self, chunks, batch_size=32, progress_callback=None):
        """chunks: list of {"content": str}. Returns float32 array (n, dim), L2-normalised."""
        texts = [c["content"] for c in chunks]
        parts = []
        for start in range(0, len(texts), batch_size):
            batch = texts[start:start + batch_size]
            parts.append(self._encode(batch))
            if progress_callback:
                progress_callback(min(start + batch_size, len(texts)), len(texts))
        if not parts:
            return np.empty((0, self.dimension), dtype="float32")
        return np.vstack(parts).astype("float32")

    def embed_query(self, question):
        """Returns float32 array of shape (1, dim)."""
        return self._encode([question])


_cache = {}
_lock = threading.Lock()


def get_embedding_generator(model_name=DEFAULT_MODEL):
    """Load each model once per server process (loading takes seconds)."""
    if model_name not in ALLOWED_MODELS:
        raise ValueError(f"Unsupported embedding model: {model_name}")
    with _lock:
        if model_name not in _cache:
            _cache[model_name] = EmbeddingGenerator(model_name)
        return _cache[model_name]
