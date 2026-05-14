#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

usage() {
  echo "Usage: convert.sh <input.md> [--html] [--pdf]"
  echo ""
  echo "Converts a Marp Markdown file to presentation format."
  echo "At least one output format (--html or --pdf) must be specified."
  echo ""
  echo "Options:"
  echo "  --html    Generate HTML presentation"
  echo "  --pdf     Generate PDF presentation"
  echo ""
  echo "Output files are placed alongside the input file."
  echo "Example: convert.sh slides.md --html --pdf"
  echo "  → slides.html + slides.pdf"
}

if [ $# -lt 2 ]; then
  usage
  exit 1
fi

INPUT=""
HTML=false
PDF=false

while [ $# -gt 0 ]; do
  case "$1" in
    --html)
      HTML=true
      shift
      ;;
    --pdf)
      PDF=true
      shift
      ;;
    -*)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
    *)
      INPUT="$1"
      shift
      ;;
  esac
done

if [ -z "$INPUT" ]; then
  echo "Error: no input file specified"
  usage
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: file not found: $INPUT"
  exit 1
fi

if [ "$HTML" = false ] && [ "$PDF" = false ]; then
  echo "Error: specify at least one output format (--html or --pdf)"
  usage
  exit 1
fi

INPUT_DIR="$(dirname "$INPUT")"
INPUT_BASE="$(basename "$INPUT" .md)"

MARP_CMD="npx @marp-team/marp-cli"

if [ "$HTML" = true ]; then
  echo "Converting to HTML..."
  $MARP_CMD --html "$INPUT" -o "$INPUT_DIR/$INPUT_BASE.html"
  echo "✅ Created: $INPUT_DIR/$INPUT_BASE.html"
fi

if [ "$PDF" = true ]; then
  echo "Converting to PDF..."
  $MARP_CMD --pdf "$INPUT" -o "$INPUT_DIR/$INPUT_BASE.pdf" --allow-local-files
  echo "✅ Created: $INPUT_DIR/$INPUT_BASE.pdf"
fi

echo "Done!"