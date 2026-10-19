# Use Debian-based Node 20 slim image
FROM node:20-bullseye-slim

# Install system dependencies (curl, procps for process management)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    procps \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install official Ollama binary
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy root and Promptpilot package files
COPY package*.json ./
COPY Promptpilot/package*.json ./Promptpilot/

# Install dependencies inside Promptpilot
WORKDIR /app/Promptpilot
RUN npm install --omit=dev

# Copy source code
WORKDIR /app
COPY . .

# Copy entrypoint script and make executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose default Render port
EXPOSE 8080
EXPOSE 10000

ENV NODE_ENV=production
ENV OLLAMA_BASE_URL=http://127.0.0.1:11434
ENV OLLAMA_MODEL=qwen3.5:2b

CMD ["/start.sh"]
