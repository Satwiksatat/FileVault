FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2 and netcat
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=app:create_app()
ENV FLASK_RUN_HOST=0.0.0.0

# Make startup script executable
RUN chmod +x start.sh

CMD ["./start.sh"] 