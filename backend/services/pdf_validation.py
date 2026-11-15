"""Server-side PDF validation: extension, size, magic bytes, and parseability."""
from django.conf import settings
from services.errors import ServiceError


def validate_pdf_upload(uploaded_file):
    """Validate an uploaded file and return its page count. Raises ServiceError on failure."""
    import fitz  # PyMuPDF

    if not uploaded_file.name.lower().endswith(".pdf"):
        raise ServiceError("Only .pdf files are allowed.")
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if uploaded_file.size > max_bytes:
        raise ServiceError(f"File exceeds the {settings.MAX_UPLOAD_MB} MB limit.", 413)
    if uploaded_file.size == 0:
        raise ServiceError("The uploaded file is empty.")

    head = uploaded_file.read(5)
    uploaded_file.seek(0)
    if head != b"%PDF-":
        raise ServiceError("File content is not a valid PDF.")

    try:
        data = uploaded_file.read()
        uploaded_file.seek(0)
        with fitz.open(stream=data, filetype="pdf") as pdf:
            if pdf.needs_pass:
                raise ServiceError("Password-protected PDFs are not supported.")
            pages = len(pdf)
    except ServiceError:
        raise
    except Exception:
        raise ServiceError("The PDF is corrupted or could not be read.")
    if pages == 0:
        raise ServiceError("The PDF has no pages.")
    return pages
