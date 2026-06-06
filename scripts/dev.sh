#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/cafework-frontend"
DB_SERVICE="cafework-postgres"
DB_CONTAINER="cafework-postgres"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo
  echo "Stopping local dev processes..."
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

cd "$ROOT_DIR"

export SERVER_PORT="${SERVER_PORT:-8081}"
export DB_URL="${DB_URL:-jdbc:postgresql://localhost:5400/CafeWork?stringtype=unspecified}"
export DB_USERNAME="${DB_USERNAME:-postgres}"
export DB_PASSWORD="${DB_PASSWORD:-postgres}"
export MAIL_USERNAME="${MAIL_USERNAME:-}"
export MAIL_PASSWORD="${MAIL_PASSWORD:-}"

echo "Starting PostgreSQL on localhost:5400..."
docker compose up -d "$DB_SERVICE"

echo "Waiting for PostgreSQL to become healthy..."
attempts=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || true)" = "healthy" ]; do
  attempts=$((attempts + 1))
  if [ "$attempts" -gt 60 ]; then
    echo "PostgreSQL did not become healthy. Last logs:" >&2
    docker compose logs --tail=80 "$DB_SERVICE" >&2 || true
    exit 1
  fi
  sleep 2
done

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm ci)
fi

echo "Starting backend on http://localhost:${SERVER_PORT}..."
(cd "$ROOT_DIR" && ./mvnw spring-boot:run) &
BACKEND_PID="$!"

echo "Starting frontend on http://localhost:5173..."
(cd "$FRONTEND_DIR" && node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort) &
FRONTEND_PID="$!"

echo
echo "CafeWork is starting:"
echo "- Backend:  http://localhost:${SERVER_PORT}"
echo "- Frontend: http://localhost:5173"
echo "- DB:       localhost:5400/CafeWork"
echo
echo "Press Ctrl+C to stop backend and frontend. Docker DB stays running."

wait -n "$BACKEND_PID" "$FRONTEND_PID"
