import { readdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'yaml';

const WORKSPACE = 'finsi';
const SKILLS_DIR = 'skills';

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return parse(match[1]);
  } catch {
    return null;
  }
}

const categories = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let created = 0;
let skipped = 0;

for (const category of categories) {
  const catDir = join(SKILLS_DIR, category);
  const skills = readdirSync(catDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const skill of skills) {
    const skillDir = join(catDir, skill);
    const tilePath = join(skillDir, 'tile.json');
    const skillMdPath = join(skillDir, 'SKILL.md');

    if (existsSync(tilePath)) {
      skipped++;
      continue;
    }

    if (!existsSync(skillMdPath)) {
      console.warn(`⚠ No SKILL.md in ${skillDir}, skipping`);
      continue;
    }

    const content = readFileSync(skillMdPath, 'utf-8');
    const fm = extractFrontmatter(content);
    const description = fm?.description || `E-commerce ${skill} skill`;

    const tile = {
      name: `${WORKSPACE}/${skill}`,
      version: '0.1.0',
      summary: description,
      skills: {
        [skill]: {
          path: 'SKILL.md'
        }
      }
    };

    writeFileSync(tilePath, JSON.stringify(tile, null, 2) + '\n');
    created++;
  }
}

console.log(`✅ Created ${created} tile.json files (${skipped} already existed)`);
