import { readdirSync, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseSkillFile } from '../lib/skill-parser.js';

function toTitleCase(kebab) {
  return kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function generateCatalog(skillsRoot) {
  const skills = [];

  const categories = readdirSync(skillsRoot)
    .filter(d => statSync(join(skillsRoot, d)).isDirectory() && !d.startsWith('.'))
    .sort();

  for (const category of categories) {
    const categoryDir = join(skillsRoot, category);
    const skillDirs = readdirSync(categoryDir)
      .filter(d => statSync(join(categoryDir, d)).isDirectory() && !d.startsWith('.'))
      .sort();

    for (const skillName of skillDirs) {
      const skillFile = join(categoryDir, skillName, 'SKILL.md');
      if (!existsSync(skillFile)) continue;

      const parsed = parseSkillFile(skillFile);
      const fm = parsed.frontmatter;

      skills.push({
        id: fm.name || skillName,
        name: toTitleCase(fm.name || skillName),
        description: fm.description || '',
        category: fm.category || category,
        risk: fm.risk || 'unknown',
        source: fm.source || 'community',
        date_added: fm.date_added || '',
        tags: fm.tags || [],
        triggers: fm.triggers || [],
        tools: fm.tools || [],
        path: `skills/${category}/${skillName}`,
        platforms: fm.platforms || [],
        difficulty: fm.difficulty || 'intermediate',
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    total: skills.length,
    skills,
  };
}

export function generateSkillsIndex(catalog) {
  return catalog.skills.map(s => ({
    id: s.id,
    path: s.path,
    category: s.category,
    name: s.name,
    description: s.description,
    risk: s.risk,
    source: s.source,
    date_added: s.date_added,
    platforms: s.platforms,
    difficulty: s.difficulty,
  }));
}

export function generateCatalogMd(catalog) {
  const lines = [];
  lines.push(`# Skill Catalog`);
  lines.push('');
  lines.push(`> ${catalog.total} skills across ${new Set(catalog.skills.map(s => s.category)).size} categories`);
  lines.push('');
  lines.push(`*Generated at ${catalog.generatedAt}*`);
  lines.push('');

  // Group by category
  const byCategory = {};
  for (const skill of catalog.skills) {
    if (!byCategory[skill.category]) byCategory[skill.category] = [];
    byCategory[skill.category].push(skill);
  }

  for (const [category, skills] of Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${toTitleCase(category)} \`${category}\``);
    lines.push('');
    lines.push('| Skill | Description | Difficulty | Platforms |');
    lines.push('|-------|-------------|------------|-----------|');
    for (const s of skills) {
      lines.push(`| \`${s.id}\` | ${s.description} | ${s.difficulty} | ${s.platforms.join(', ')} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// CLI entry point
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isMain) {
  const skillsRoot = resolve(process.cwd(), 'skills');
  const dataDir = resolve(process.cwd(), 'data');

  if (!existsSync(skillsRoot)) {
    console.error('No skills/ directory found');
    process.exit(1);
  }

  const catalog = generateCatalog(skillsRoot);

  // Ensure data/ exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  writeFileSync(join(dataDir, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  writeFileSync(join(dataDir, 'skills_index.json'), JSON.stringify(generateSkillsIndex(catalog), null, 2) + '\n');
  writeFileSync(resolve(process.cwd(), 'CATALOG.md'), generateCatalogMd(catalog));

  console.log(`✅ Generated catalog: ${catalog.total} skills`);
  console.log(`   → data/catalog.json`);
  console.log(`   → data/skills_index.json`);
  console.log(`   → CATALOG.md`);
}
