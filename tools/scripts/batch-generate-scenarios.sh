#!/bin/bash
# Batch generate Tessl eval scenarios for all tiles
# Usage: ./tools/scripts/batch-generate-scenarios.sh [count_per_tile]

COUNT=${1:-3}
OUTFILE="data/scenario-generations.json"
echo "[" > "$OUTFILE"
first=true

for tiledir in skills/*/*; do
  if [ ! -f "$tiledir/tile.json" ]; then
    continue
  fi

  # Skip if evals already exist
  if [ -d "$tiledir/evals" ] && [ "$(ls -A "$tiledir/evals" 2>/dev/null)" ]; then
    echo "⏭  Skipping $tiledir (evals already exist)"
    continue
  fi

  skill=$(basename "$tiledir")
  echo "🚀 Generating $COUNT scenarios for $skill..."

  output=$(tessl scenario generate --count "$COUNT" "$tiledir" 2>&1)
  gen_id=$(echo "$output" | grep -oE '019[a-f0-9-]+')

  if [ -n "$gen_id" ]; then
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$OUTFILE"
    fi
    echo "  {\"skill\": \"$skill\", \"path\": \"$tiledir\", \"generation_id\": \"$gen_id\"}" >> "$OUTFILE"
    echo "  ✅ $skill → $gen_id"
  else
    echo "  ❌ $skill failed: $output"
  fi

  # Small delay to avoid rate limiting
  sleep 2
done

echo "" >> "$OUTFILE"
echo "]" >> "$OUTFILE"
echo ""
echo "✅ Done! Generation IDs saved to $OUTFILE"
echo "Monitor progress with: tessl scenario list --mine"
