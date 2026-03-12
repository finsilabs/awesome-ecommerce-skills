#!/bin/bash
# Download completed scenario generations and place in tile evals/ directories
# Usage: ./tools/scripts/batch-download-scenarios.sh

GENFILE="data/scenario-generations.json"

if [ ! -f "$GENFILE" ]; then
  echo "❌ No $GENFILE found. Run batch-generate-scenarios.sh first."
  exit 1
fi

downloaded=0
failed=0
pending=0
skipped=0

while IFS= read -r line; do
  skill=$(echo "$line" | sed -n 's/.*"skill": *"\([^"]*\)".*/\1/p')
  path=$(echo "$line" | sed -n 's/.*"path": *"\([^"]*\)".*/\1/p')
  gen_id=$(echo "$line" | sed -n 's/.*"generation_id": *"\([^"]*\)".*/\1/p')

  if [ -z "$gen_id" ] || [ -z "$path" ]; then
    continue
  fi

  # Skip if already downloaded
  if [ -d "$path/evals" ] && [ "$(ls -A "$path/evals" 2>/dev/null)" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # Check status
  status=$(tessl scenario view "$gen_id" 2>&1)
  if echo "$status" | grep -q "Status:.*Completed"; then
    output=$(tessl scenario download "$gen_id" --output "$path/evals" 2>&1)
    if echo "$output" | grep -q "Downloaded"; then
      echo "✅ $skill"
      downloaded=$((downloaded + 1))
    else
      echo "❌ $skill download error: $output"
      failed=$((failed + 1))
    fi
  elif echo "$status" | grep -q "Status:.*Failed"; then
    echo "❌ $skill generation failed"
    failed=$((failed + 1))
  else
    pending=$((pending + 1))
  fi
done < "$GENFILE"

echo ""
echo "📊 Downloaded: $downloaded | ⏭ Skipped: $skipped | ❌ Failed: $failed | ⏳ Pending: $pending"
