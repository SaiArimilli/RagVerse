"""GET /api/dashboard/stats/ - aggregated numbers for the dashboard charts."""
from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from experiments.models import DocumentChunk, ExperimentRun
from rag.models import ChatMessage, ChatSession
from .models import UploadedDocument

EXPERIMENT_NAMES = {1: "PDF & Chunking", 2: "Embeddings", 3: "Vector Search", 4: "RAG Q&A"}


class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        docs = UploadedDocument.objects.filter(owner=user)
        runs = ExperimentRun.objects.filter(document__owner=user)
        done = runs.filter(status=ExperimentRun.Status.COMPLETED)

        totals = {
            "documents": docs.count(),
            "pages": docs.aggregate(n=Sum("page_count"))["n"] or 0,
            "chunks": DocumentChunk.objects.filter(document__owner=user).count(),
            "indexed_documents": docs.filter(status=UploadedDocument.Status.INDEXED).count(),
            "chat_sessions": ChatSession.objects.filter(owner=user).count(),
            "questions_asked": ChatMessage.objects.filter(session__owner=user, role="user").count(),
        }

        status_breakdown = [
            {"status": s, "count": n}
            for s, n in docs.order_by().values_list("status").annotate(n=Count("id"))
        ]

        per_exp = {
            row["experiment"]: row
            for row in done.order_by().values("experiment").annotate(
                runs=Count("id"), documents_completed=Count("document", distinct=True))
        }
        experiment_progress = [
            {"experiment": e, "name": name,
             "runs": per_exp.get(e, {}).get("runs", 0),
             "documents_completed": per_exp.get(e, {}).get("documents_completed", 0)}
            for e, name in EXPERIMENT_NAMES.items()
        ]

        today = timezone.now().date()
        start = today - timedelta(days=6)
        by_day = {
            row["day"]: row["n"]
            for row in runs.filter(started_at__date__gte=start)
            .annotate(day=TruncDate("started_at")).values("day")
            .annotate(n=Count("id")).order_by("day")
        }
        activity = [
            {"date": (start + timedelta(days=i)).strftime("%b %d"),
             "runs": by_day.get(start + timedelta(days=i), 0)}
            for i in range(7)
        ]

        recent_runs = [
            {"id": r.id, "experiment": r.experiment, "name": EXPERIMENT_NAMES[r.experiment],
             "document": r.document.title, "status": r.status, "started_at": r.started_at}
            for r in runs.select_related("document")[:8]
        ]

        return Response({
            "totals": totals, "status_breakdown": status_breakdown,
            "experiment_progress": experiment_progress,
            "activity": activity, "recent_runs": recent_runs,
        })
