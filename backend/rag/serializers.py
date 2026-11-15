from rest_framework import serializers


class AskSerializer(serializers.Serializer):
    document_id = serializers.IntegerField(min_value=1)
    question = serializers.CharField(max_length=2000)
    session_id = serializers.IntegerField(required=False, allow_null=True)
