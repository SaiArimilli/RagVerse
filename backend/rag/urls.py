from django.urls import path
from .views import AskView, HealthView, SessionDetailView, SessionListView

urlpatterns = [
    path("ask/", AskView.as_view()),
    path("health/", HealthView.as_view()),
    path("sessions/", SessionListView.as_view()),
    path("sessions/<int:pk>/", SessionDetailView.as_view()),
]
