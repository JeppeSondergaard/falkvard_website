#!/usr/bin/env bash
# Import a SQL dump into the local SQLite database.
# Usage: ./scripts/db-import.sh [input_file]
#
# WARNING: This replaces the current local database entirely.
# Default input: scripts/falkvard-dump.sql

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="${DB_PATH:-$PROJECT_DIR/data/falkvard.db}"
INPUT="${1:-$SCRIPT_DIR/falkvard-dump.sql}"
DATA_DIR="$(dirname "$DB_PATH")"

if [ ! -f "$INPUT" ]; then
  echo "Error: Dump file not found at $INPUT"
  exit 1
fi

mkdir -p "$DATA_DIR"

if [ -f "$DB_PATH" ]; then
  BACKUP="$DB_PATH.backup.$(date +%s)"
  echo "Backing up existing database to: $BACKUP"
  cp "$DB_PATH" "$BACKUP"
fi

echo "Removing old database files..."
rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"

echo "Importing from: $INPUT"
sqlite3 "$DB_PATH" < "$INPUT"

TABLES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
echo "Done. Database has $TABLES tables."
sqlite3 "$DB_PATH" "SELECT name, (SELECT COUNT(*) FROM pragma_table_info(name)) as columns FROM sqlite_master WHERE type='table';"
