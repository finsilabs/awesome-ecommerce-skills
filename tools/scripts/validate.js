import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseSkillFile } from '../lib/skill-parser.js';

export function validateSkillDirectory(skillDir, expectedCategory, expectedName) {
  const errors = [];
  const skillFile = join(skillDir, 'SKILL.md');

  if (!existsSync(skillFile)) {
    return { errors: ['Missing SKILL.md file'], warnings: [] };
  }

  const parsed = parseSkillFile(skillFile);
  errors.push(...parsed.errors);

  const fm = parsed.frontmatter;

  // Name must match directory name
  if (fm.name && fm.name !== expectedName) {
    errors.push(`Frontmatter name "${fm.name}" does not match directory name "${expectedName}"`);
  }

  // Category must match parent directory
  if (fm.category && fm.category !== expectedCategory) {
    errors.push(`Frontmatter category "${fm.category}" does not match parent directory "${expectedCategory}"`);
  }

  return { errors, frontmatter: fm, content: parsed.content };
}

export function validateAll(skillsRoot) {
  const results = { totalSkills: 0, totalErrors: 0, skills: [] };

  if (!existsSync(skillsRoot)) {
    console.error(`Skills directory not found: ${skillsRoot}`);
    return results;
  }

  const categories = readdirSync(skillsRoot).filter(d =>
    statSync(join(skillsRoot, d)).isDirectory() && !d.startsWith('.')
  );

  for (const category of categories) {
    const categoryDir = join(skillsRoot, category);
    const skillDirs = readdirSync(categoryDir).filter(d =>
      statSync(join(categoryDir, d)).isDirectory() && !d.startsWith('.')
    );

    for (const skillName of skillDirs) {
      const skillDir = join(categoryDir, skillName);
      const result = validateSkillDirectory(skillDir, category, skillName);
      results.totalSkills++;
      results.totalErrors += result.errors.length;
      results.skills.push({
        path: `skills/${category}/${skillName}`,
        errors: result.errors,
      });
    }
  }

  return results;
}

// CLI entry point
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isMain) {
  const strict = process.argv.includes('--strict');
  const skillsRoot = resolve(process.cwd(), 'skills');
  const results = validateAll(skillsRoot);

  console.log(`\nValidated ${results.totalSkills} skills`);

  for (const skill of results.skills) {
    if (skill.errors.length > 0) {
      console.log(`\n❌ ${skill.path}:`);
      for (const error of skill.errors) {
        console.log(`   - ${error}`);
      }
    }
  }

  if (results.totalErrors === 0) {
    console.log('\n✅ All skills valid!\n');
  } else {
    console.log(`\n⚠️  ${results.totalErrors} error(s) found across ${results.totalSkills} skills\n`);
    if (strict) {
      process.exit(1);
    }
  }
}
