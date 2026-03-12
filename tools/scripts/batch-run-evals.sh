#!/bin/bash
# Batch run Tessl evals for all tiles that have scenarios
# Usage: ./tools/scripts/batch-run-evals.sh

OUTFILE="data/eval-runs.json"
echo "[" > "$OUTFILE"
first=true

for tiledir in skills/*/*; do
  if [ ! -f "$tiledir/tile.json" ]; then
    continue
  fi

  if [ ! -d "$tiledir/evals" ] || [ -z "$(ls -A "$tiledir/evals" 2>/dev/null)" ]; then
    continue
  fi

  skill=$(basename "$tiledir")
  echo "🧪 Running eval for $skill..."

  output=$(tessl eval run "$tiledir" 2>&1)
  eval_id=$(echo "$output" | grep -oE '019[a-f0-9-]+' | head -1)

  if [ -n "$eval_id" ]; then
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$OUTFILE"
    fi
    echo "  {\"skill\": \"$skill\", \"path\": \"$tiledir\", \"eval_id\": \"$eval_id\"}" >> "$OUTFILE"
    echo "  ✅ $skill → $eval_id"
  else
    echo "  ❌ $skill failed: $output"
  fi

  sleep 2
done

echo "" >> "$OUTFILE"
echo "]" >> "$OUTFILE"
echo ""
echo "✅ Done! Eval run IDs saved to $OUTFILE"
echo "Monitor with: tessl eval list --mine"
