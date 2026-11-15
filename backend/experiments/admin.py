from django.contrib import admin
from .models import DocumentChunk, ExperimentRun
admin.site.register(ExperimentRun)
admin.site.register(DocumentChunk)
