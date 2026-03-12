import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf-8' });
  return (result.stdout || '') + (result.stderr || '');
}

// Read and parse the generations file (may have malformed JSON from grep)
const raw = readFileSync('data/scenario-generations.json', 'utf-8');

const entries = [];
for (const line of raw.split('\n')) {
  const trimmed = line.trim().replace(/^,/, '').trim();
  if (!trimmed.startsWith('{')) continue;

  const skill = trimmed.match(/"skill":\s*"([^"]+)"/)?.[1];
  const path = trimmed.match(/"path":\s*"([^"]+)"/)?.[1];
  const genId = trimmed.match(/"generation_id":\s*"(019[a-f0-9-]{32,36})/)?.[1];

  if (skill && path && genId) {
    entries.push({ skill, path, genId });
  }
}

console.log(`Found ${entries.length} generation entries\n`);

let downloaded = 0, failed = 0, pending = 0, skipped = 0;

for (const { skill, path, genId } of entries) {
  const evalsDir = join(path, 'evals');
  if (existsSync(evalsDir)) {
    try {
      const contents = readdirSync(evalsDir);
      if (contents.length > 0) {
        skipped++;
        continue;
      }
    } catch {}
  }

  try {
    const status = run('tessl', ['scenario', 'view', genId]);

    if (status.includes('Completed')) {
      const output = run('tessl', ['scenario', 'download', genId, '--output', evalsDir]);
      if (output.includes('Downloaded')) {
        console.log(`✅ ${skill}`);
        downloaded++;
      } else {
        console.log(`❌ ${skill} download error`);
        failed++;
      }
    } else if (status.includes('Failed')) {
      console.log(`❌ ${skill} generation failed`);
      failed++;
    } else {
      pending++;
    }
  } catch (e) {
    console.log(`❌ ${skill} error: ${e.message}`);
    failed++;
  }
}

console.log(`\n📊 Downloaded: ${downloaded} | ⏭ Skipped: ${skipped} | ❌ Failed: ${failed} | ⏳ Pending: ${pending}`);
