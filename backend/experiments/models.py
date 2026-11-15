from django.db import models
from documents.models import UploadedDocument


class ExperimentRun(models.Model):
    """One execution of an experiment (1-4) against a document."""
    class Experiment(models.IntegerChoices):
        CHUNKING = 1, "PDF loading and chunking"
        EMBEDDING = 2, "Embeddings"
        INDEXING = 3, "Vector indexing and search"
        RAG = 4, "RAG question answering"

    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name="runs")
    experiment = models.PositiveSmallIntegerField(choices=Experiment.choices)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.RUNNING)
    parameters = models.JSONField(default=dict, blank=True)   # chunk_size, overlap, model, k...
    results = models.JSONField(default=dict, blank=True)      # counts, dimensions, timings...
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]


class DocumentChunk(models.Model):
    """A text chunk with its original PDF page number. chunk_index matches its vector row."""
    document = models.ForeignKey(UploadedDocument, on_delete=models.CASCADE, related_name="chunks")
    chunk_index = models.PositiveIntegerField()
    page_number = models.PositiveIntegerField()
    content = models.TextField()
    char_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document", "chunk_index"]
        unique_together = [("document", "chunk_index")]
