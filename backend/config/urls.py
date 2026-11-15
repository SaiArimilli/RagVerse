from django.contrib import admin
from django.urls import include, path

from documents.dashboard import DashboardStatsView

# NOTE: media files are intentionally NOT served publicly. PDFs are streamed
# through the authenticated endpoint /api/documents/<id>/file/ instead.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/documents/", include("documents.urls")),
    path("api/experiments/", include("experiments.urls")),
    path("api/rag/", include("rag.urls")),
    path("api/dashboard/stats/", DashboardStatsView.as_view()),
]
