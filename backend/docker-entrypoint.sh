#!/bin/bash
set -e

echo "Waiting for PostgreSQL database to be ready..."
# A simple wait loop using netcat (nc) to check if the DB port is open
# PostgreSQL default port is 5432
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is up and running!"

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
