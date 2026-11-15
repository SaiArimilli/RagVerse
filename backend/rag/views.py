from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from documents.views import get_user_document
from experiments.embedding_generator import DEFAULT_MODEL, get_embedding_generator
from experiments.rag_engine import RAGEngine, gemini_config, mask_key
from experiments.workflow import load_store, tracked_run
from services.errors import ServiceError
from .models import ChatMessage, ChatSession
from .serializers import AskSerializer

TOP_K = 4          # chunks retrieved by vector similarity per question
HISTORY_TURNS = 6  # last N messages passed to Gemini for follow-ups


def message_dict(m):
    return {"id": m.id, "role": m.role, "content": m.content,
            "sources": m.sources, "created_at": m.created_at}


class AskView(APIView):
    def post(self, request):
        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        doc = get_user_document(request.user, data["document_id"])
        question = data["question"].strip()

        with tracked_run(doc, 4, {"question": question}) as run:
            store = load_store(doc)   # 409 if the document is not indexed yet
            engine = RAGEngine()      # fail fast (missing key) BEFORE touching the database

            session, history = None, []
            if data.get("session_id"):
                session = get_object_or_404(ChatSession, pk=data["session_id"],
                                            owner=request.user, document=doc)
                history = [{"role": m.role, "content": m.content}
                           for m in session.messages.order_by("-created_at")[:HISTORY_TURNS]][::-1]

            # For follow-ups ("and its cost?") include the previous question in retrieval.
            last_user = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
            retrieval_query = f"{last_user} {question}".strip() if last_user else question

            vector = get_embedding_generator(store.model_name or DEFAULT_MODEL).embed_query(retrieval_query)
            retrieved = store.search(vector, k=TOP_K)
            result = engine.generate_answer(question, retrieved, history)

            # Save only after Gemini succeeded, so failures never leave empty chats behind.
            with transaction.atomic():
                if session is None:
                    session = ChatSession.objects.create(owner=request.user, document=doc, title=question[:60])
                ChatMessage.objects.create(session=session, role="user", content=question)
                reply = ChatMessage.objects.create(session=session, role="assistant",
                                                   content=result["answer"], sources=result["sources"])
                session.save(update_fields=["updated_at"])
            run.results = {"session_id": session.id, "sources": len(retrieved)}

        return Response({"session_id": session.id, "question": question,
                         "answer": reply.content, "sources": reply.sources})


class HealthView(APIView):
    """GET /api/rag/health/            -> is the key loaded?
       GET /api/rag/health/?test=1     -> also make a tiny live call to Gemini."""

    def get(self, request):
        cfg = gemini_config()
        info = {
            "configured": bool(cfg["api_key"]),
            "key_preview": mask_key(cfg["api_key"]),
            "model": cfg["model"],
            "env_file_found": (settings.BASE_DIR / ".env").exists(),
        }
        if request.query_params.get("test") and info["configured"]:
            try:
                RAGEngine().ping()
                info["test"] = {"ok": True, "message": "Gemini responded successfully."}
            except ServiceError as exc:
                info["test"] = {"ok": False, "message": exc.message}
        return Response(info)


class SessionListView(APIView):
    def get(self, request):
        sessions = ChatSession.objects.filter(owner=request.user)
        if request.query_params.get("document_id"):
            sessions = sessions.filter(document_id=request.query_params["document_id"])
        return Response([{"id": s.id, "title": s.title, "document_id": s.document_id,
                          "updated_at": s.updated_at, "message_count": s.messages.count()}
                         for s in sessions])


class SessionDetailView(APIView):
    def get(self, request, pk):
        session = get_object_or_404(ChatSession, pk=pk, owner=request.user)
        return Response({"id": session.id, "title": session.title, "document_id": session.document_id,
                         "messages": [message_dict(m) for m in session.messages.all()]})

    def delete(self, request, pk):
        get_object_or_404(ChatSession, pk=pk, owner=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
