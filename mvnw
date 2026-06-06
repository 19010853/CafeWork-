#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROPS_FILE="$BASE_DIR/.mvn/wrapper/maven-wrapper.properties"

if command -v mvn >/dev/null 2>&1; then
  exec mvn "$@"
fi

distribution_url="$(sed -n 's/^distributionUrl=//p' "$PROPS_FILE" | tail -n 1 | tr -d '\r')"

if [ -z "$distribution_url" ]; then
  echo "Missing distributionUrl in $PROPS_FILE" >&2
  exit 1
fi

maven_version="$(basename "$distribution_url" | sed -E 's/apache-maven-([0-9.]+)-bin\.zip/\1/')"

if [ -z "$maven_version" ]; then
  echo "Cannot detect Maven version from $distribution_url" >&2
  exit 1
fi

maven_home="$BASE_DIR/.mvn/apache-maven-$maven_version"
archive="$BASE_DIR/.mvn/apache-maven-$maven_version-bin.zip"

if [ ! -x "$maven_home/bin/mvn" ]; then
  mkdir -p "$BASE_DIR/.mvn"
  if [ ! -f "$archive" ]; then
    echo "Downloading Maven $maven_version..."
    curl -fsSL "$distribution_url" -o "$archive"
  fi

  echo "Extracting Maven $maven_version..."
  if command -v unzip >/dev/null 2>&1; then
    unzip -q "$archive" -d "$BASE_DIR/.mvn"
  else
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '$archive' -DestinationPath '$BASE_DIR/.mvn' -Force" >/dev/null
  fi
fi

exec "$maven_home/bin/mvn" "$@"
