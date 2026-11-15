import uuid
from django.conf import settings
from django.db import models


def pdf_upload_path(instance, filename):
    # Per-user folder + uuid prefix avoids collisions and cross-user overwrites
    return f"documents/user_{instance.owner_id}/{uuid.uuid4().hex}_{filename}"


class UploadedDocument(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        EXTRACTED = "extracted", "Text extracted"
        CHUNKED = "chunked", "Chunked"
        EMBEDDED = "embedded", "Embedded"
        INDEXED = "indexed", "Indexed (ready for Q&A)"
        FAILED = "failed", "Failed"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=pdf_upload_path)
    file_size = models.PositiveIntegerField(default=0)
    page_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED)
    error_message = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title
