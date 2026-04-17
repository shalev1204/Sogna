# Sognatore Security Sandbox Image v1
# Purpose: Isolated Offensive/Defensive Auditing

FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

# Update and install security auditing tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git \
    nmap \
    sqlmap \
    nikto \
    gobuster \
    ca-certificates \
 && curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

LABEL maintainer="Sognatore Security Engine"
LABEL description="Sognatore Security Sandbox v1 (Pentest Edition)"
LABEL version="1.0.0"

# Security hardening: Disable potential bypasses
RUN chmod 750 /usr/bin/nmap /usr/bin/sqlmap

CMD ["nmap", "--version"]
