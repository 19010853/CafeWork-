#!/usr/bin/env bash
set -euo pipefail

BACKEND_PORT="${BACKEND_PORT:-8081}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

kill_port_with_lsof() {
  local port="$1"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    while IFS= read -r pid; do
      [ -n "$pid" ] && kill "$pid" >/dev/null 2>&1 || true
    done <<< "$pids"
    return 0
  fi

  return 1
}

kill_port_with_fuser() {
  local port="$1"
  fuser -k "${port}/tcp" >/dev/null 2>&1 || return 1
}

kill_port_with_netstat_windows() {
  local port="$1"
  local pids

  pids="$(netstat -ano 2>/dev/null | awk -v port=":${port}" '$1 ~ /TCP/ && $2 ~ port && $4 == "LISTENING" { print $5 }' | sort -u || true)"
  if [ -n "$pids" ]; then
    while IFS= read -r pid; do
      [ -n "$pid" ] && taskkill /PID "$pid" /F >/dev/null 2>&1 || true
    done <<< "$pids"
    return 0
  fi

  return 1
}

kill_port() {
  local port="$1"

  if kill_port_with_lsof "$port"; then
    echo "Stopped process(es) listening on port $port"
    return 0
  fi

  if kill_port_with_fuser "$port"; then
    echo "Stopped process(es) listening on port $port"
    return 0
  fi

  if kill_port_with_netstat_windows "$port"; then
    echo "Stopped process(es) listening on port $port"
    return 0
  fi

  echo "No listening process found on port $port"
}

echo "Cleaning dev ports..."
kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"
