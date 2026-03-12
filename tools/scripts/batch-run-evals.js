import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: 'utf-8' });
  return (result.stdout || '') + (result.stderr || '');
}

const SKILLS_DIR = 'skills';
const results = [];
let launched = 0, skipped = 0, failed = 0;

const categories = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

for (const category of categories) {
  const catDir = join(SKILLS_DIR, category);
  const skills = readdirSync(catDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const skill of skills) {
    const skillDir = join(catDir, skill);
    const tileJson = join(skillDir, 'tile.json');
    const evalsDir = join(skillDir, 'evals');

    if (!existsSync(tileJson) || !existsSync(evalsDir)) {
      skipped++;
      continue;
    }

    const output = run('tessl', ['eval', 'run', skillDir]);
    const evalId = output.match(/(019[a-f0-9-]{32,36})/)?.[1];

    if (evalId) {
      console.log(`✅ ${skill} → ${evalId}`);
      results.push({ skill, path: skillDir, eval_id: evalId });
      launched++;
    } else {
      console.log(`❌ ${skill}: ${output.split('\n').find(l => l.includes('✖') || l.includes('error')) || 'unknown error'}`);
      failed++;
    }
  }
}

writeFileSync('data/eval-runs.json', JSON.stringify(results, null, 2) + '\n');
console.log(`\n🧪 Launched: ${launched} | ⏭ Skipped: ${skipped} | ❌ Failed: ${failed}`);
console.log('Monitor with: tessl eval list --mine');
