"""Experiment 1 - PDF loading and text chunking."""
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extract_pages(pdf_path):
    """Extract text from every page. Returns {"total_pages", "pages":[{page,text,char_count}]}."""
    pages = []
    with fitz.open(pdf_path) as pdf:
        total = len(pdf)
        for number, page in enumerate(pdf, start=1):
            text = page.get_text("text")
            pages.append({"page": number, "text": text, "char_count": len(text)})
    return {"total_pages": total, "pages": pages}


def split_pages(pages, chunk_size=1000, overlap=200):
    """Split each page separately so every chunk keeps its ORIGINAL page number."""
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
    chunks = []
    for doc in pages:
        if not doc["text"].strip():
            continue
        for text in splitter.split_text(doc["text"]):
            chunks.append({"page": doc["page"], "content": text})
    return chunks


def load_and_split_pdf(pdf_path, chunk_size=1000, overlap=200):
    extracted = extract_pages(pdf_path)
    chunks = split_pages(extracted["pages"], chunk_size, overlap)
    return {"total_pages": extracted["total_pages"], "total_chunks": len(chunks), "chunks": chunks}
