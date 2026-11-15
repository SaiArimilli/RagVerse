from django.urls import path
from .views import DocumentDetailView, DocumentFileView, DocumentListView, DocumentUploadView

urlpatterns = [
    path("upload/", DocumentUploadView.as_view()),
    path("<int:pk>/file/", DocumentFileView.as_view()),
    path("<int:pk>/", DocumentDetailView.as_view()),
    path("", DocumentListView.as_view()),
]
