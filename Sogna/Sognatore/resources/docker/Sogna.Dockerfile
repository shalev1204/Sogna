# Sognatore Sandbox Image v4
# Decoupling: Establishing 100% OS Dependencies
# Base: Canonical Ubuntu (Cached local)

FROM ubuntu:latest

# Disable interactive frontend for apt to prevent hanging
ENV DEBIAN_FRONTEND=noninteractive

# Update and install Python 3, Node.js (v20), Rust, & Essential tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    git \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Workspace Configuration
WORKDIR /workspace

LABEL maintainer="Sognatore AI Engine"
LABEL description="Sognatore Independent Sandbox v4 (Independent Ubuntu Build)"
LABEL version="4.0.1"

# Health Check Command
CMD ["sh", "-c", "node -v && python3 --version && rustc --version"]
