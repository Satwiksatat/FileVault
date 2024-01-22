#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
python3 migrate.py

# Start the application
echo "Starting Flask application..."
exec gunicorn -b 0.0.0.0:8000 "app:create_app()" 