from rest_framework import serializers
from .models import UploadedDocument


class DocumentSerializer(serializers.ModelSerializer):
    chunk_count = serializers.SerializerMethodField()

    class Meta:
        model = UploadedDocument
        fields = ["id", "title", "file_size", "page_count", "status",
                  "error_message", "chunk_count", "uploaded_at", "updated_at"]
        read_only_fields = fields

    def get_chunk_count(self, obj):
        return obj.chunks.count()
