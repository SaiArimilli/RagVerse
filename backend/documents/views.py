from django.http import FileResponse
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from experiments.vector_store import remove_index_dir
from services.errors import ServiceError
from services.pdf_validation import validate_pdf_upload
from .models import UploadedDocument
from .serializers import DocumentSerializer


def get_user_document(user, pk):
    """Always scope by owner so users can never touch each other's documents."""
    return get_object_or_404(UploadedDocument, pk=pk, owner=user)


class DocumentUploadView(APIView):
    def post(self, request):
        f = request.FILES.get("file")
        if f is None:
            raise ServiceError("No file provided. Send the PDF in the 'file' field.")
        pages = validate_pdf_upload(f)
        doc = UploadedDocument.objects.create(
            owner=request.user,
            title=(request.data.get("title") or f.name)[:255],
            file=f, file_size=f.size, page_count=pages,
        )
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentListView(APIView):
    def get(self, request):
        docs = UploadedDocument.objects.filter(owner=request.user)
        return Response(DocumentSerializer(docs, many=True).data)


class DocumentDetailView(APIView):
    def get(self, request, pk):
        return Response(DocumentSerializer(get_user_document(request.user, pk)).data)

    def delete(self, request, pk):
        doc = get_user_document(request.user, pk)
        remove_index_dir(doc.id)          # drop vector index + embeddings
        doc.file.delete(save=False)       # drop the PDF
        doc.delete()                      # cascades chunks, runs, chats
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentFileView(APIView):
    """Authenticated PDF download/preview (media is not publicly served)."""

    def get(self, request, pk):
        doc = get_user_document(request.user, pk)
        try:
            handle = doc.file.open("rb")
        except FileNotFoundError:
            raise ServiceError("The PDF file is missing on the server.", 404)
        return FileResponse(handle, content_type="application/pdf")
