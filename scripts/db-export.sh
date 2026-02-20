#!/usr/bin/env bash
# Export the SQLite database to a SQL dump file.
# Usage: ./scripts/db-export.sh [output_file]
#
# The dump can be committed to git or transferred to another environment.
# Default output: scripts/falkvard-dump.sql

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="${DB_PATH:-$PROJECT_DIR/data/falkvard.db}"
OUTPUT="${1:-$SCRIPT_DIR/falkvard-dump.sql}"

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database not found at $DB_PATH"
  exit 1
fi

echo "Exporting database from: $DB_PATH"
echo "Writing dump to: $OUTPUT"

sqlite3 "$DB_PATH" .dump > "$OUTPUT"

LINES=$(wc -l < "$OUTPUT" | tr -d ' ')
echo "Done. Exported $LINES lines."
