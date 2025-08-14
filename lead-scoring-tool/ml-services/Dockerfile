# Lead Scoring Tool - ML Services Dockerfile
# TensorFlow and scikit-learn based machine learning microservice

FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base as development

# Install development dependencies
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy application code
COPY . .

# Create model directory
RUN mkdir -p /app/models /app/data

# Create non-root user
RUN useradd --create-home --shell /bin/bash mluser && chown -R mluser:mluser /app
USER mluser

# Expose port
EXPOSE 8001

# Development command with hot reloading
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# Production stage
FROM base as production

# Copy application code
COPY . .

# Create model directory
RUN mkdir -p /app/models /app/data

# Create non-root user
RUN useradd --create-home --shell /bin/bash mluser && chown -R mluser:mluser /app
USER mluser

# Expose port
EXPOSE 8001

# Production command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]