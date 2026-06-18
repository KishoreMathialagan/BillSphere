# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Tesseract OCR and psycopg2
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    gcc \
    libpq-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install pytesseract Pillow pdf2image

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
