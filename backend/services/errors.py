"""Consistent JSON error responses ({"error": "..."}) for the React client."""
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ServiceError(Exception):
    """Raised by service-layer code (PDF parsing, vector search, Gemini) for expected failures."""

    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _first_message(data):
    if isinstance(data, dict):
        for key, value in data.items():
            msg = _first_message(value)
            if msg:
                return msg if key in ("non_field_errors", "detail") else f"{key}: {msg}"
    elif isinstance(data, (list, tuple)) and data:
        return _first_message(data[0])
    elif data:
        return str(data)
    return ""


def api_exception_handler(exc, context):
    if isinstance(exc, ServiceError):
        return Response({"error": exc.message}, status=exc.status_code)
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {"error": _first_message(response.data) or "Request failed"}
    return response
