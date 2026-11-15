from rest_framework.response import Response
from rest_framework.views import APIView

from documents.models import UploadedDocument
from documents.views import get_user_document
from . import workflow
from .models import ExperimentRun
from .serializers import (ChunkRequestSerializer, DocumentIdSerializer,
                          EmbedRequestSerializer, SearchRequestSerializer)


class ExperimentView(APIView):
    """POST view: validate input -> fetch the caller's own document -> run()."""
    serializer_class = DocumentIdSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        doc = get_user_document(request.user, serializer.validated_data["document_id"])
        return Response(self.run(doc, serializer.validated_data))

    def run(self, doc, data):
        raise NotImplementedError


class ExtractView(ExperimentView):
    def run(self, doc, data):
        return workflow.run_extraction(doc)


class ChunkView(ExperimentView):
    serializer_class = ChunkRequestSerializer

    def run(self, doc, data):
        return workflow.run_chunking(doc, data["chunk_size"], data["chunk_overlap"])


class EmbedView(ExperimentView):
    serializer_class = EmbedRequestSerializer

    def run(self, doc, data):
        if data.get("query"):  # query-embedding demo (no chunks needed)
            return workflow.embed_query_preview(data["model_name"], data["query"])
        return workflow.run_embedding(doc, data["model_name"])


class IndexView(ExperimentView):
    def run(self, doc, data):
        return workflow.run_indexing(doc)


class SearchView(ExperimentView):
    serializer_class = SearchRequestSerializer

    def run(self, doc, data):
        return workflow.run_search(doc, data["query"], data["k"])


class _DocQueryView(APIView):
    def get_doc(self, request):
        serializer = DocumentIdSerializer(data={"document_id": request.query_params.get("document_id")})
        serializer.is_valid(raise_exception=True)
        return get_user_document(request.user, serializer.validated_data["document_id"])


class ChunksListView(_DocQueryView):
    def get(self, request):
        return Response(workflow.chunks_payload(self.get_doc(request)))


class ProgressView(_DocQueryView):
    def get(self, request):
        return Response(workflow.get_progress(self.get_doc(request)))


class RunsView(_DocQueryView):
    def get(self, request):
        runs = ExperimentRun.objects.filter(document=self.get_doc(request))[:30]
        return Response([{"id": r.id, "experiment": r.experiment, "status": r.status,
                          "parameters": r.parameters, "results": r.results,
                          "error_message": r.error_message, "started_at": r.started_at,
                          "finished_at": r.finished_at} for r in runs])
