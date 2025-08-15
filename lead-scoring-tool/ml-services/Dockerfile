# Lead Scoring Tool ML Services Dockerfile
# Multi-stage build for ML services with optimized dependencies

# Base stage with Python and ML dependencies
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libc6-dev \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    libhdf5-dev \
    libatlas-base-dev \
    liblapack-dev \
    libblas-dev \
    libopenblas-dev \
    gfortran \
    pkg-config \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Dependencies stage
FROM base AS deps

# Upgrade pip and install build tools
RUN pip install --upgrade pip setuptools wheel

# Copy requirements
COPY requirements.txt requirements-dev.txt ./

# Install Python dependencies
RUN pip install -r requirements.txt

# Development stage
FROM deps AS development

# Install development dependencies
RUN pip install -r requirements-dev.txt

# Install Jupyter extensions
RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager

# Copy source code
COPY . .

# Create models and data directories
RUN mkdir -p /app/models /app/data /app/logs

# Create non-root user for development
RUN groupadd -r mluser && useradd -r -g mluser mluser
RUN chown -R mluser:mluser /app
USER mluser

# Expose ports (API and Jupyter)
EXPOSE 8001 8888

# Development command
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# Builder stage
FROM deps AS builder

# Copy source code
COPY . .

# Pre-compile Python bytecode
RUN python -m compileall src/

# Download pre-trained models and assets
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')" || true
RUN python -c "import spacy; spacy.cli.download('en_core_web_sm')" || true

# Production stage
FROM python:3.11-slim AS production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    libhdf5-103 \
    libatlas3-base \
    libopenblas0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r mluser && useradd -r -g mluser mluser

# Set working directory
WORKDIR /app

# Copy built dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=mluser:mluser . .

# Create necessary directories
RUN mkdir -p /app/models /app/data /app/logs && \
    chown -R mluser:mluser /app

# Switch to non-root user
USER mluser

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Production command
CMD ["gunicorn", "src.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8001", "--timeout", "300"]

# GPU-enabled stage (optional)
FROM nvidia/cuda:11.8-runtime-ubuntu22.04 AS gpu

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.11 as default
RUN ln -s /usr/bin/python3.11 /usr/bin/python

WORKDIR /app

# Copy requirements and install GPU-specific packages
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt
RUN pip install tensorflow[and-cuda]

# Copy application code
COPY . .

# Create non-root user
RUN groupadd -r mluser && useradd -r -g mluser mluser
RUN chown -R mluser:mluser /app
USER mluser

EXPOSE 8001

CMD ["gunicorn", "src.main:app", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8001", "--timeout", "600"]

# Jupyter development stage
FROM development AS jupyter

# Install additional Jupyter extensions
RUN pip install \
    jupyterlab-git \
    jupyterlab-lsp \
    python-lsp-server[all] \
    jupyterlab-code-formatter \
    black \
    isort

# Configure Jupyter
RUN jupyter lab --generate-config
RUN echo "c.ServerApp.ip = '0.0.0.0'" >> ~/.jupyter/jupyter_lab_config.py
RUN echo "c.ServerApp.allow_root = True" >> ~/.jupyter/jupyter_lab_config.py
RUN echo "c.ServerApp.open_browser = False" >> ~/.jupyter/jupyter_lab_config.py

# Expose Jupyter port
EXPOSE 8888

# Jupyter command
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root"]

# Testing stage
FROM development AS testing

# Copy test files
COPY tests/ ./tests/

# Install test-specific dependencies
RUN pip install pytest-xdist pytest-benchmark

# Run tests
RUN python -m pytest tests/ --cov=src --cov-report=html --cov-report=term -n auto