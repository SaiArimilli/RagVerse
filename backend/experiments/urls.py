from django.urls import path
from . import views

urlpatterns = [
    path("extract/", views.ExtractView.as_view()),
    path("chunk/", views.ChunkView.as_view()),
    path("chunks/", views.ChunksListView.as_view()),
    path("embed/", views.EmbedView.as_view()),
    path("progress/", views.ProgressView.as_view()),
    path("index/", views.IndexView.as_view()),
    path("search/", views.SearchView.as_view()),
    path("runs/", views.RunsView.as_view()),
]
