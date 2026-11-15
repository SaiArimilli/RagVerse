from rest_framework import serializers
from .embedding_generator import ALLOWED_MODELS, DEFAULT_MODEL


class DocumentIdSerializer(serializers.Serializer):
    document_id = serializers.IntegerField(min_value=1)


class ChunkRequestSerializer(DocumentIdSerializer):
    chunk_size = serializers.IntegerField(min_value=100, max_value=5000, default=1000)
    chunk_overlap = serializers.IntegerField(min_value=0, max_value=2000, default=200)

    def validate(self, attrs):
        if attrs["chunk_overlap"] >= attrs["chunk_size"]:
            raise serializers.ValidationError("Chunk overlap must be smaller than chunk size.")
        return attrs


class EmbedRequestSerializer(DocumentIdSerializer):
    model_name = serializers.ChoiceField(choices=ALLOWED_MODELS, default=DEFAULT_MODEL)
    query = serializers.CharField(required=False, allow_blank=False, max_length=1000)


class SearchRequestSerializer(DocumentIdSerializer):
    query = serializers.CharField(max_length=1000)
    k = serializers.IntegerField(min_value=1, max_value=20, default=5)
