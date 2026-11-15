Developed By :
23A81A6101 - Venkata Sai Durga Prakash Arumelli
23A81A6118 - Varun Kumar Gogada

# RagVerse - AI Document Intelligence Platform
React (Vite + Tailwind) frontend + Django REST backend. Upload a PDF, then run:
1. **PDF loading & chunking** (PyMuPDF + RecursiveCharacterTextSplitter)
2. **Embeddings** (MiniLM through ONNX Runtime, 384-d)
3. **Vector indexing & semantic search** (top 5, saved to disk)
4. **RAG chat** (top 4 chunks -> Gemini, page citations, chat history)

## 1. Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
# edit .env: set GEMINI_API_KEY and DJANGO_SECRET_KEY
.\venv\Scripts\python.exe manage.py makemigrations documents experiments rag
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver  # http://127.0.0.1:8000
```
Note: the first embedding run downloads the ONNX model and tokenizer from Hugging Face and needs internet.

## 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env                # optional; defaults to http://127.0.0.1:8000/api
npm run dev                         # http://localhost:5173
```

## 3. Sample testing workflow
1. Open http://localhost:5173, click **Get Started**, register an account.
2. **Documents** -> drag in a text-based PDF (not a scanned image).
3. **Experiment 1** -> Extract text, then Split into chunks. Check pages/chunks counts.
4. **Experiment 2** -> Generate embeddings. Expect dimension 384 and a progress bar.
5. **Experiment 3** -> Create the vector index, then search a phrase from your PDF. Top 5 results show scores and pages.
6. **Experiment 4** -> Ask a question, then a follow-up. Ask something unrelated: you should get
   "I could not find this information in the uploaded document."
7. Restart `runserver` and ask again: the index is reloaded from `backend/vector_indexes/doc_<id>/` with no re-embedding.
8. **Complete Workflow** -> runs steps 1-4 in one click.

### Command-line check (no frontend)
```powershell
cd backend
.\venv\Scripts\python.exe -c "from experiments.pipeline import run_complete_pipeline as r; print(r('sample.pdf','What is this document about?'))"
```

## API summary (all require `Authorization: Token <token>` except register/login)
POST /api/auth/register|login|logout/, GET /api/auth/me/
POST /api/documents/upload/, GET /api/documents/, GET|DELETE /api/documents/{id}/, GET /api/documents/{id}/file/
POST /api/experiments/extract|chunk|embed|index|search/, GET /api/experiments/chunks|progress|runs/?document_id=
POST /api/rag/ask/, GET /api/rag/sessions/, GET|DELETE /api/rag/sessions/{id}/
GET /api/dashboard/stats/

## Notes
- Gemini key lives only in backend `.env`; React never sees it.
- Every query is filtered by owner, so users cannot read each other's documents, chunks or chats.
- Production: set DJANGO_DEBUG=False, use PostgreSQL, run embedding/indexing in a task queue (Celery) for large PDFs, serve behind HTTPS.
