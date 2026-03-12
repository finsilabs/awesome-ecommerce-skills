# Awesome E-Commerce Skills Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a curated, open-source repository of 132 e-commerce skills for AI coding assistants with validation tooling, CI pipeline, Tessl eval integration, and full documentation.

**Architecture:** Tooling-first approach — build validation/generation scripts, then scaffold the repo, then author skills in parallel category batches. Each skill is a directory with SKILL.md (YAML frontmatter + markdown content). Generated data files (catalog.json, skills_index.json, CATALOG.md) are produced by Node.js scripts.

**Tech Stack:** Node.js (no framework, built-in `node:test`, `node:fs`, `node:path`), YAML parsing (`yaml` package), GitHub Actions CI, Tessl CLI for evals.

**Spec:** `docs/superpowers/specs/2026-03-12-awesome-ecommerce-skills-design.md`

---

## Chunk 1: Repository Foundation & Tooling

### Task 1: Initialize Repository

**Files:**
- Create: `package.json`
- Create: `LICENSE`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/andreirebrov/IdeaProjects/awesome-ecommerce-skills
git init
```

- [ ] **Step 2: Create package.json**

Create `package.json`:

```json
{
  "name": "awesome-ecommerce-skills",
  "version": "1.0.0",
  "description": "132 curated e-commerce skills for AI coding assistants and commerce practitioners",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "validate": "node tools/scripts/validate.js",
    "validate:strict": "node tools/scripts/validate.js --strict",
    "catalog": "node tools/scripts/generate-catalog.js",
    "readme": "node tools/scripts/generate-readme.js",
    "chain": "npm run validate:strict && npm run catalog && npm run readme",
    "test": "node --test tools/scripts/__tests__/"
  },
  "devDependencies": {
    "yaml": "^2.8.2"
  }
}
```

- [ ] **Step 3: Create .gitignore**

Create `.gitignore`:

```
node_modules/
.DS_Store
*.log
.env
```

- [ ] **Step 4: Create LICENSE**

Create `LICENSE` with MIT license text, copyright 2026.

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json LICENSE .gitignore
git commit -m "chore: initialize repository with package.json and MIT license"
```

---

### Task 2: Skill Parser Library

**Files:**
- Create: `tools/lib/skill-parser.js`
- Test: `tools/scripts/__tests__/skill-parser.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tools/scripts/__tests__/skill-parser.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSkillFile, REQUIRED_FIELDS, VALID_DIFFICULTIES, VALID_SOURCES, VALID_TOOLS, VALID_RISK_LEVELS } from '../../lib/skill-parser.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TMP = join(import.meta.dirname, '__tmp_parser__');

function setupTmp() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
}

function cleanTmp() {
  rmSync(TMP, { recursive: true, force: true });
}

describe('skill-parser', () => {
  describe('parseSkillFile', () => {
    it('parses valid SKILL.md with all required fields', () => {
      setupTmp();
      const content = `---
name: test-skill
description: "A test skill for validation"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [test, validation]
tools: [claude-code, cursor]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Test Skill

## Overview
This is a test skill.

## When to Use This Skill
- When testing

## Core Instructions
1. Do the thing

## Examples
\`\`\`js
console.log('hello');
\`\`\`
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.equal(result.frontmatter.name, 'test-skill');
      assert.equal(result.frontmatter.category, 'storefront-ui');
      assert.equal(result.frontmatter.difficulty, 'intermediate');
      assert.deepEqual(result.frontmatter.tags, ['test', 'validation']);
      assert.equal(result.errors.length, 0);
      assert.ok(result.content.includes('# Test Skill'));
      cleanTmp();
    });

    it('returns errors for missing required fields', () => {
      setupTmp();
      const content = `---
name: incomplete-skill
---

# Incomplete
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.includes('description')));
      assert.ok(result.errors.some(e => e.includes('category')));
      cleanTmp();
    });

    it('returns error for invalid difficulty', () => {
      setupTmp();
      const content = `---
name: bad-diff
description: "Test"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [test]
tools: [claude-code]
platforms: [platform-agnostic]
difficulty: expert
---

# Bad Difficulty
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.ok(result.errors.some(e => e.includes('difficulty')));
      cleanTmp();
    });

    it('returns error for invalid source', () => {
      setupTmp();
      const content = `---
name: bad-source
description: "Test"
category: storefront-ui
risk: safe
source: stolen
date_added: "2026-03-12"
tags: [test]
tools: [claude-code]
platforms: [platform-agnostic]
difficulty: beginner
---

# Bad Source
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.ok(result.errors.some(e => e.includes('source')));
      cleanTmp();
    });

    it('returns error for invalid risk level', () => {
      setupTmp();
      const content = `---
name: bad-risk
description: "Test"
category: storefront-ui
risk: dangerous
source: curated
date_added: "2026-03-12"
tags: [test]
tools: [claude-code]
platforms: [platform-agnostic]
difficulty: beginner
---

# Bad Risk
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.ok(result.errors.some(e => e.includes('risk')));
      cleanTmp();
    });

    it('returns error for description over 200 chars', () => {
      setupTmp();
      const longDesc = 'A'.repeat(201);
      const content = `---
name: long-desc
description: "${longDesc}"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
tags: [test]
tools: [claude-code]
platforms: [platform-agnostic]
difficulty: beginner
---

# Long Desc
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.ok(result.errors.some(e => e.includes('200')));
      cleanTmp();
    });

    it('handles optional fields without error', () => {
      setupTmp();
      const content = `---
name: optional-fields
description: "Has optional fields"
category: storefront-ui
risk: safe
source: curated
date_added: "2026-03-12"
date_modified: "2026-03-15"
tags: [test]
triggers: ["do the thing", "make it work"]
tools: [claude-code]
platforms: [platform-agnostic]
difficulty: beginner
---

# Optional Fields
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.equal(result.errors.length, 0);
      assert.equal(result.frontmatter.date_modified, '2026-03-15');
      assert.deepEqual(result.frontmatter.triggers, ['do the thing', 'make it work']);
      cleanTmp();
    });

    it('returns error for invalid YAML', () => {
      setupTmp();
      const content = `---
name: [invalid yaml
---

# Bad YAML
`;
      const filePath = join(TMP, 'SKILL.md');
      writeFileSync(filePath, content);

      const result = parseSkillFile(filePath);

      assert.ok(result.errors.some(e => e.includes('YAML') || e.includes('parse')));
      cleanTmp();
    });
  });

  describe('constants', () => {
    it('exports valid difficulties', () => {
      assert.deepEqual(VALID_DIFFICULTIES, ['beginner', 'intermediate', 'advanced']);
    });

    it('exports valid sources', () => {
      assert.deepEqual(VALID_SOURCES, ['community', 'personal', 'curated']);
    });

    it('exports valid risk levels', () => {
      assert.deepEqual(VALID_RISK_LEVELS, ['safe', 'unknown', 'critical']);
    });

    it('exports valid tools', () => {
      assert.ok(VALID_TOOLS.includes('claude-code'));
      assert.ok(VALID_TOOLS.includes('cursor'));
      assert.ok(VALID_TOOLS.includes('gemini-cli'));
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/scripts/__tests__/skill-parser.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement skill-parser.js**

Create `tools/lib/skill-parser.js`:

```javascript
import { readFileSync } from 'node:fs';
import YAML from 'yaml';

export const REQUIRED_FIELDS = [
  'name', 'description', 'category', 'risk', 'source',
  'date_added', 'tags', 'tools', 'platforms', 'difficulty'
];

export const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
export const VALID_SOURCES = ['community', 'personal', 'curated'];
export const VALID_RISK_LEVELS = ['safe', 'unknown', 'critical'];
export const VALID_TOOLS = [
  'claude-code', 'cursor', 'gemini-cli', 'copilot',
  'codex-cli', 'kiro', 'opencode'
];

export function parseSkillFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const errors = [];

  // Extract frontmatter
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: {}, content: raw, errors: ['No valid YAML frontmatter found'] };
  }

  let frontmatter;
  try {
    frontmatter = YAML.parse(fmMatch[1]);
  } catch (e) {
    return { frontmatter: {}, content: fmMatch[2], errors: [`YAML parse error: ${e.message}`] };
  }

  if (!frontmatter || typeof frontmatter !== 'object') {
    return { frontmatter: {}, content: fmMatch[2], errors: ['Frontmatter is not a valid object'] };
  }

  const content = fmMatch[2];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (frontmatter[field] === undefined || frontmatter[field] === null || frontmatter[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate enums
  if (frontmatter.difficulty && !VALID_DIFFICULTIES.includes(frontmatter.difficulty)) {
    errors.push(`Invalid difficulty "${frontmatter.difficulty}" — must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  if (frontmatter.source && !VALID_SOURCES.includes(frontmatter.source)) {
    errors.push(`Invalid source "${frontmatter.source}" — must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  if (frontmatter.risk && !VALID_RISK_LEVELS.includes(frontmatter.risk)) {
    errors.push(`Invalid risk "${frontmatter.risk}" — must be one of: ${VALID_RISK_LEVELS.join(', ')}`);
  }

  // Validate description length
  if (frontmatter.description && frontmatter.description.length > 200) {
    errors.push(`Description exceeds 200 characters (${frontmatter.description.length})`);
  }

  // Validate arrays
  for (const field of ['tags', 'tools', 'platforms']) {
    if (frontmatter[field] && !Array.isArray(frontmatter[field])) {
      errors.push(`Field "${field}" must be an array`);
    }
  }

  // Validate optional arrays
  if (frontmatter.triggers && !Array.isArray(frontmatter.triggers)) {
    errors.push(`Field "triggers" must be an array`);
  }

  return { frontmatter, content, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/scripts/__tests__/skill-parser.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/skill-parser.js tools/scripts/__tests__/skill-parser.test.js
git commit -m "feat: add skill parser library with YAML frontmatter validation"
```

---

### Task 3: Validation Script

**Files:**
- Create: `tools/scripts/validate.js`
- Test: `tools/scripts/__tests__/validate.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tools/scripts/__tests__/validate.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSkillDirectory, validateAll } from '../validate.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const TMP = join(import.meta.dirname, '__tmp_validate__');

const VALID_SKILL = `---
name: test-skill
description: "A test skill"
category: test-category
risk: safe
source: curated
date_added: "2026-03-12"
tags: [test]
tools: [claude-code]
platforms: [platform-agnostic]
difficulty: beginner
---

# Test Skill

## Overview
A test skill for validation.

## When to Use This Skill
- When testing

## Core Instructions
1. Test it

## Examples
\`\`\`js
console.log('test');
\`\`\`
`;

function setup(skills = {}) {
  rmSync(TMP, { recursive: true, force: true });
  for (const [catSkill, content] of Object.entries(skills)) {
    const dir = join(TMP, catSkill);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), content);
  }
}

function clean() {
  rmSync(TMP, { recursive: true, force: true });
}

describe('validate', () => {
  describe('validateSkillDirectory', () => {
    it('returns no errors for a valid skill', () => {
      setup({ 'test-category/test-skill': VALID_SKILL });
      const result = validateSkillDirectory(
        join(TMP, 'test-category/test-skill'),
        'test-category',
        'test-skill'
      );
      assert.equal(result.errors.length, 0);
      clean();
    });

    it('returns error when SKILL.md is missing', () => {
      rmSync(TMP, { recursive: true, force: true });
      mkdirSync(join(TMP, 'test-category/empty-skill'), { recursive: true });
      const result = validateSkillDirectory(
        join(TMP, 'test-category/empty-skill'),
        'test-category',
        'empty-skill'
      );
      assert.ok(result.errors.some(e => e.includes('SKILL.md')));
      clean();
    });

    it('returns error when name does not match directory', () => {
      const wrongName = VALID_SKILL.replace('name: test-skill', 'name: wrong-name');
      setup({ 'test-category/test-skill': wrongName });
      const result = validateSkillDirectory(
        join(TMP, 'test-category/test-skill'),
        'test-category',
        'test-skill'
      );
      assert.ok(result.errors.some(e => e.includes('name') && e.includes('match')));
      clean();
    });

    it('returns error when category does not match parent directory', () => {
      const wrongCat = VALID_SKILL.replace('category: test-category', 'category: wrong-category');
      setup({ 'test-category/test-skill': wrongCat });
      const result = validateSkillDirectory(
        join(TMP, 'test-category/test-skill'),
        'test-category',
        'test-skill'
      );
      assert.ok(result.errors.some(e => e.includes('category') && e.includes('match')));
      clean();
    });
  });

  describe('validateAll', () => {
    it('validates all skills in a skills directory', () => {
      setup({
        'cat-a/skill-one': VALID_SKILL.replace('name: test-skill', 'name: skill-one').replace('category: test-category', 'category: cat-a'),
        'cat-b/skill-two': VALID_SKILL.replace('name: test-skill', 'name: skill-two').replace('category: test-category', 'category: cat-b'),
      });
      const results = validateAll(TMP);
      assert.equal(results.totalSkills, 2);
      assert.equal(results.totalErrors, 0);
      clean();
    });

    it('collects errors across multiple skills', () => {
      setup({
        'cat-a/skill-one': VALID_SKILL.replace('name: test-skill', 'name: skill-one').replace('category: test-category', 'category: cat-a'),
        'cat-b/bad-skill': '---\nname: bad-skill\n---\n# Bad',
      });
      const results = validateAll(TMP);
      assert.equal(results.totalSkills, 2);
      assert.ok(results.totalErrors > 0);
      clean();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/scripts/__tests__/validate.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement validate.js**

Create `tools/scripts/validate.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/scripts/__tests__/validate.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/scripts/validate.js tools/scripts/__tests__/validate.test.js
git commit -m "feat: add skill validation script with directory and frontmatter checks"
```

---

### Task 4: Catalog Generation Script

**Files:**
- Create: `tools/scripts/generate-catalog.js`
- Test: `tools/scripts/__tests__/generate-catalog.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tools/scripts/__tests__/generate-catalog.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCatalog, generateCatalogMd, generateSkillsIndex } from '../generate-catalog.js';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TMP = join(import.meta.dirname, '__tmp_catalog__');

const SKILL_A = `---
name: skill-a
description: "First test skill"
category: cat-one
risk: safe
source: curated
date_added: "2026-03-12"
tags: [alpha, test]
triggers: ["do alpha"]
tools: [claude-code, cursor]
platforms: [platform-agnostic]
difficulty: beginner
---

# Skill A
`;

const SKILL_B = `---
name: skill-b
description: "Second test skill"
category: cat-two
risk: unknown
source: community
date_added: "2026-03-10"
tags: [beta]
tools: [claude-code]
platforms: [shopify]
difficulty: advanced
---

# Skill B
`;

function setup() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'skills/cat-one/skill-a'), { recursive: true });
  mkdirSync(join(TMP, 'skills/cat-two/skill-b'), { recursive: true });
  writeFileSync(join(TMP, 'skills/cat-one/skill-a/SKILL.md'), SKILL_A);
  writeFileSync(join(TMP, 'skills/cat-two/skill-b/SKILL.md'), SKILL_B);
}

function clean() {
  rmSync(TMP, { recursive: true, force: true });
}

describe('generate-catalog', () => {
  it('generates catalog.json with correct structure', () => {
    setup();
    const catalog = generateCatalog(join(TMP, 'skills'));

    assert.equal(catalog.total, 2);
    assert.ok(Array.isArray(catalog.skills));
    assert.ok(catalog.generatedAt);

    const a = catalog.skills.find(s => s.id === 'skill-a');
    assert.equal(a.name, 'Skill A');
    assert.equal(a.category, 'cat-one');
    assert.deepEqual(a.tags, ['alpha', 'test']);
    assert.deepEqual(a.triggers, ['do alpha']);
    assert.equal(a.path, 'skills/cat-one/skill-a');
    assert.equal(a.difficulty, 'beginner');
    clean();
  });

  it('generates skills_index.json without tags/triggers/tools but with all index fields', () => {
    setup();
    const catalog = generateCatalog(join(TMP, 'skills'));
    const index = generateSkillsIndex(catalog);

    assert.equal(index.length, 2);
    const a = index.find(s => s.id === 'skill-a');
    assert.equal(a.name, 'Skill A');
    assert.equal(a.category, 'cat-one');
    assert.equal(a.description, 'First test skill');
    assert.equal(a.risk, 'safe');
    assert.equal(a.source, 'curated');
    assert.equal(a.date_added, '2026-03-12');
    assert.equal(a.difficulty, 'beginner');
    assert.deepEqual(a.platforms, ['platform-agnostic']);
    assert.ok(a.path);
    // These should NOT be in the index
    assert.equal(a.tags, undefined);
    assert.equal(a.triggers, undefined);
    assert.equal(a.tools, undefined);
    clean();
  });

  it('generates CATALOG.md grouped by category', () => {
    setup();
    const catalog = generateCatalog(join(TMP, 'skills'));
    const md = generateCatalogMd(catalog);

    assert.ok(md.includes('# Skill Catalog'));
    assert.ok(md.includes('cat-one'));
    assert.ok(md.includes('cat-two'));
    assert.ok(md.includes('skill-a'));
    assert.ok(md.includes('skill-b'));
    assert.ok(md.includes('2 skills'));
    clean();
  });

  it('sorts skills alphabetically within categories', () => {
    setup();
    const catalog = generateCatalog(join(TMP, 'skills'));

    const catOneSkills = catalog.skills.filter(s => s.category === 'cat-one');
    const catTwoSkills = catalog.skills.filter(s => s.category === 'cat-two');
    assert.equal(catOneSkills.length, 1);
    assert.equal(catTwoSkills.length, 1);
    clean();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/scripts/__tests__/generate-catalog.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement generate-catalog.js**

Create `tools/scripts/generate-catalog.js`:

```javascript
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
    lines.push(`## ${toTitleCase(category)}`);
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/scripts/__tests__/generate-catalog.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/scripts/generate-catalog.js tools/scripts/__tests__/generate-catalog.test.js
git commit -m "feat: add catalog generation script for catalog.json, skills_index.json, and CATALOG.md"
```

---

### Task 5: README Generation Script

**Files:**
- Create: `tools/scripts/generate-readme.js`
- Test: `tools/scripts/__tests__/generate-readme.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tools/scripts/__tests__/generate-readme.test.js`:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateReadme } from '../generate-readme.js';

describe('generate-readme', () => {
  const mockCatalog = {
    generatedAt: '2026-03-12T00:00:00.000Z',
    total: 3,
    skills: [
      { id: 'skill-a', name: 'Skill A', description: 'Desc A', category: 'cat-one', difficulty: 'beginner', platforms: ['platform-agnostic'], tags: ['a'] },
      { id: 'skill-b', name: 'Skill B', description: 'Desc B', category: 'cat-one', difficulty: 'advanced', platforms: ['shopify'], tags: ['b'] },
      { id: 'skill-c', name: 'Skill C', description: 'Desc C', category: 'cat-two', difficulty: 'intermediate', platforms: ['platform-agnostic'], tags: ['c'] },
    ],
  };

  it('generates README with title and skill count', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('Awesome E-Commerce Skills'));
    assert.ok(readme.includes('3'));
  });

  it('includes category table', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('cat-one'));
    assert.ok(readme.includes('cat-two'));
  });

  it('includes quick start section', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('Quick Start'));
  });

  it('includes tessl install instructions', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('tessl install'));
  });

  it('includes contributing section', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('Contributing'));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test tools/scripts/__tests__/generate-readme.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement generate-readme.js**

Create `tools/scripts/generate-readme.js`:

```javascript
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

function toTitleCase(kebab) {
  return kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function generateReadme(catalog) {
  // Group by category
  const byCategory = {};
  for (const skill of catalog.skills) {
    if (!byCategory[skill.category]) byCategory[skill.category] = [];
    byCategory[skill.category].push(skill);
  }

  const categoryCount = Object.keys(byCategory).length;

  const lines = [];

  // Header
  lines.push('# Awesome E-Commerce Skills');
  lines.push('');
  lines.push(`> ${catalog.total} curated e-commerce skills for AI coding assistants and commerce practitioners.`);
  lines.push('');
  lines.push(`![Skills](https://img.shields.io/badge/skills-${catalog.total}-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)`);
  lines.push('');
  lines.push('**Compatible with:** Claude Code | Cursor | Gemini CLI | Copilot | Codex CLI | Kiro | OpenCode');
  lines.push('');

  // TOC
  lines.push('## Table of Contents');
  lines.push('');
  lines.push('- [Quick Start](#quick-start)');
  lines.push('- [Installation](#installation)');
  lines.push('- [What\'s Inside](#whats-inside)');
  lines.push('- [Project Structure](#project-structure)');
  lines.push('- [Top 10 Starter Skills](#top-10-starter-skills)');
  lines.push('- [Curated Bundles](#curated-bundles)');
  lines.push('- [Workflows](#workflows)');
  lines.push('- [Categories](#categories)');
  lines.push('- [Browse All Skills](#browse-all-skills)');
  lines.push('- [Contributing](#contributing)');
  lines.push('- [License](#license)');
  lines.push('');

  // Quick Start
  lines.push('## Quick Start');
  lines.push('');
  lines.push('1. Clone this repo');
  lines.push('2. Copy skills you need into your project\'s context');
  lines.push('3. Invoke with `@skill-name` in your AI assistant');
  lines.push('');

  // Installation
  lines.push('## Installation');
  lines.push('');
  lines.push('**Via Tessl (recommended):**');
  lines.push('');
  lines.push('```sh');
  lines.push('# Install the Tessl CLI');
  lines.push('curl -fsSL https://get.tessl.io | sh');
  lines.push('');
  lines.push('# Install individual skills');
  lines.push('tessl install awesome-ecommerce/stripe-integration');
  lines.push('tessl install awesome-ecommerce/checkout-flow-optimization');
  lines.push('```');
  lines.push('');
  lines.push('**Manual:**');
  lines.push('');
  lines.push('```sh');
  lines.push('git clone https://github.com/YOUR_USERNAME/awesome-ecommerce-skills.git');
  lines.push('cp -r awesome-ecommerce-skills/skills/payments-checkout/stripe-integration .claude/skills/');
  lines.push('```');
  lines.push('');

  // What's Inside
  lines.push('## What\'s Inside');
  lines.push('');
  lines.push(`- **${catalog.total} skills** across ${categoryCount} categories`);
  lines.push('- Every skill evaluated with [Tessl](https://tessl.io) task evals (baseline vs with-skill comparison)');
  lines.push('- Role-based bundles for quick onboarding');
  lines.push('- Multi-step workflows for common e-commerce journeys');
  lines.push('- Validation tooling and CI pipeline');
  lines.push('');

  // Top 10
  lines.push('## Top 10 Starter Skills');
  lines.push('');
  lines.push('| Skill | Category | Description |');
  lines.push('|-------|----------|-------------|');
  const starterIds = [
    'checkout-flow-optimization', 'product-data-modeling', 'stripe-integration',
    'ecommerce-seo', 'cart-logic', 'inventory-tracking',
    'shipping-rate-calculator', 'customer-accounts', 'discount-engine',
    'product-page-design'
  ];
  for (const id of starterIds) {
    const skill = catalog.skills.find(s => s.id === id);
    if (skill) {
      lines.push(`| \`@${skill.id}\` | ${skill.category} | ${skill.description} |`);
    }
  }
  lines.push('');

  // Categories
  lines.push('## Categories');
  lines.push('');
  lines.push('| Category | Skills | Description |');
  lines.push('|----------|--------|-------------|');
  for (const [category, skills] of Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`| **${toTitleCase(category)}** | ${skills.length} | ${skills.map(s => `\`@${s.id}\``).slice(0, 3).join(', ')}${skills.length > 3 ? ', ...' : ''} |`);
  }
  lines.push('');

  // Browse All
  lines.push('## Browse All Skills');
  lines.push('');
  lines.push(`See [CATALOG.md](CATALOG.md) for the full list of ${catalog.total} skills with descriptions, tags, and eval scores.`);
  lines.push('');

  // Contributing
  lines.push('## Contributing');
  lines.push('');
  lines.push('We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.');
  lines.push('');
  lines.push('```sh');
  lines.push('# Validate your skill locally');
  lines.push('npm run validate');
  lines.push('```');
  lines.push('');

  // License
  lines.push('## License');
  lines.push('');
  lines.push('MIT');
  lines.push('');

  return lines.join('\n');
}

// CLI entry point
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename);
if (isMain) {
  const catalogPath = resolve(process.cwd(), 'data/catalog.json');
  if (!existsSync(catalogPath)) {
    console.error('No data/catalog.json found. Run `npm run catalog` first.');
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  const readme = generateReadme(catalog);
  writeFileSync(resolve(process.cwd(), 'README.md'), readme);
  console.log('✅ Generated README.md');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test tools/scripts/__tests__/generate-readme.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/scripts/generate-readme.js tools/scripts/__tests__/generate-readme.test.js
git commit -m "feat: add README generation script with category tables and Tessl install instructions"
```

---

## Chunk 2: GitHub Config, Documentation & Data Files

### Task 6: GitHub Configuration

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/eval.yml`
- Create: `.github/ISSUE_TEMPLATE/new-skill.md`
- Create: `.github/ISSUE_TEMPLATE/bug-report.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, 'feat/*']
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Validate skills
        run: npm run validate:strict

      - name: Run tests
        run: npm test

      - name: Regenerate catalog and README
        run: npm run catalog && npm run readme

      - name: Check for drift
        if: github.ref == 'refs/heads/main'
        run: |
          if [[ -n $(git status --porcelain data/ CATALOG.md README.md) ]]; then
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            git add data/ CATALOG.md README.md
            git commit -m "chore: regenerate catalog and README [skip ci]"
            git push
          fi

  skill-review:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Tessl Skill Review
        uses: tesslio/skill-review@v1
        with:
          path: skills/
```

- [ ] **Step 2: Create eval workflow**

Create `.github/workflows/eval.yml`:

```yaml
name: Tessl Eval

on:
  workflow_dispatch:
    inputs:
      skill_path:
        description: 'Path to skill directory (or "all" for full suite)'
        required: true
        default: 'all'
  schedule:
    - cron: '0 6 * * 1'

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Tessl CLI
        run: curl -fsSL https://get.tessl.io | sh

      - name: Run evals
        run: tessl eval run ${{ github.event.inputs.skill_path || 'all' }}
        env:
          TESSL_API_KEY: ${{ secrets.TESSL_API_KEY }}
```

- [ ] **Step 3: Create issue templates**

Create `.github/ISSUE_TEMPLATE/new-skill.md`:

```markdown
---
name: New Skill Proposal
about: Propose a new e-commerce skill
title: "[SKILL] "
labels: new-skill
assignees: ''
---

## Skill Name
<!-- kebab-case, e.g., cart-abandonment-recovery -->

## Category
<!-- One of: storefront-ui, catalog-inventory, payments-checkout, pricing-promotions, fulfillment-shipping, customer-crm, marketing-growth, platform-shopify, platform-woocommerce, platform-magento, platform-salesforce-cc, headless-modern, security-compliance, infrastructure-performance, integrations-apis, data-analytics, business-operations -->

## Description
<!-- One sentence, under 200 chars -->

## Why This Skill?
<!-- What problem does it solve? Who needs it? -->

## Existing Alternatives
<!-- Are there similar skills already? How is this different? -->
```

Create `.github/ISSUE_TEMPLATE/bug-report.md`:

```markdown
---
name: Bug Report
about: Report an issue with a skill or tooling
title: "[BUG] "
labels: bug
assignees: ''
---

## Skill or Tool
<!-- Which skill or tool is affected? -->

## Expected Behavior
<!-- What should happen? -->

## Actual Behavior
<!-- What actually happens? -->

## Steps to Reproduce
1.
2.
3.

## Environment
- AI Assistant:
- OS:
```

- [ ] **Step 4: Create PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## What

<!-- Brief description of changes -->

## Type

- [ ] New skill(s)
- [ ] Skill improvement
- [ ] Tooling / infrastructure
- [ ] Documentation
- [ ] Bug fix

## Checklist

- [ ] `npm run validate` passes locally
- [ ] Skill has all required sections (Overview, When to Use, Core Instructions, Examples)
- [ ] Frontmatter has all required fields
- [ ] `@skill-name` cross-references point to existing skills
- [ ] Description is under 200 characters
```

- [ ] **Step 5: Commit**

```bash
git add .github/
git commit -m "chore: add CI/eval workflows, issue templates, and PR template"
```

---

### Task 7: Documentation

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `docs/contributors/skill-template.md`
- Create: `docs/contributors/skill-anatomy.md`
- Create: `docs/contributors/quality-bar.md`
- Create: `docs/users/getting-started.md`
- Create: `docs/users/bundles.md`
- Create: `docs/maintainers/release-process.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

Create `CONTRIBUTING.md`:

```markdown
# Contributing to Awesome E-Commerce Skills

Thank you for contributing! This guide covers everything you need to add or improve skills.

## Adding a New Skill

1. **Fork and clone** this repository
2. **Create a branch:** `git checkout -b add/your-skill-name`
3. **Create the skill directory:**
   ```
   skills/<category>/your-skill-name/
   └── SKILL.md
   ```
4. **Write SKILL.md** using the [skill template](docs/contributors/skill-template.md)
5. **Validate locally:** `npm run validate`
6. **Submit a PR**

## Skill Quality Bar

Every skill must have at minimum:

- Valid YAML frontmatter with all required fields
- **Overview** — 2-4 sentences explaining what the skill does
- **When to Use This Skill** — bullet list of scenarios
- **Core Instructions** — numbered steps or structured guidance
- **Examples** — at least one code sample or configuration snippet

See [quality-bar.md](docs/contributors/quality-bar.md) for the full quality bar.

## Skill Format

See [skill-anatomy.md](docs/contributors/skill-anatomy.md) for the complete format reference.

## Validation

```sh
npm install
npm run validate          # Soft mode (warnings)
npm run validate:strict   # Strict mode (errors fail)
```

## Categories

| Category | Directory |
|----------|-----------|
| Storefront & UI | `storefront-ui` |
| Catalog & Inventory | `catalog-inventory` |
| Payments & Checkout | `payments-checkout` |
| Pricing & Promotions | `pricing-promotions` |
| Fulfillment & Shipping | `fulfillment-shipping` |
| Customer & CRM | `customer-crm` |
| Marketing & Growth | `marketing-growth` |
| Shopify | `platform-shopify` |
| WooCommerce | `platform-woocommerce` |
| Magento | `platform-magento` |
| Salesforce CC | `platform-salesforce-cc` |
| Headless & Modern | `headless-modern` |
| Security & Compliance | `security-compliance` |
| Infrastructure & Performance | `infrastructure-performance` |
| Integrations & APIs | `integrations-apis` |
| Data & Analytics | `data-analytics` |
| Business Operations | `business-operations` |
```

- [ ] **Step 2: Create skill-template.md**

Create `docs/contributors/skill-template.md`:

```markdown
# Skill Template

Copy this template to create a new skill. Replace all placeholder text.

---

\`\`\`markdown
---
name: your-skill-name
description: "One sentence, under 200 characters"
category: category-name
risk: safe
source: community
date_added: "YYYY-MM-DD"
tags: [tag1, tag2, tag3]
tools: [claude-code, cursor, gemini-cli]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Your Skill Name

## Overview

2-4 sentences explaining what this skill helps you build or do. Focus on the outcome, not the process.

## When to Use This Skill

- When you need to [specific scenario]
- When building [specific feature]
- When migrating from [X] to [Y]

## Core Instructions

1. **Step one** — what to do first
2. **Step two** — what to do next
3. **Step three** — and so on

## Examples

\\\`\\\`\\\`javascript
// Example code here
\\\`\\\`\\\`

## Best Practices

- **Do** this thing
- **Do** this other thing
- **Don't** do this bad thing

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Common mistake | How to fix it |

## Related Skills

- @related-skill-one
- @related-skill-two
\`\`\`
```

- [ ] **Step 3: Create skill-anatomy.md**

Create `docs/contributors/skill-anatomy.md`:

```markdown
# Skill Anatomy

## Directory Structure

```
skills/<category>/<skill-name>/
├── SKILL.md              # Required — the skill content
├── evals/                # Optional — Tessl eval scenarios
│   └── scenario-1/
│       ├── task.md
│       ├── criteria.json
│       └── capability.txt
├── references/           # Optional — external docs, guides
├── templates/            # Optional — reusable code patterns
└── examples/             # Optional — real-world demos
```

## Frontmatter Fields

| Field | Required | Type | Values |
|-------|----------|------|--------|
| `name` | Yes | string | Kebab-case, must match directory name |
| `description` | Yes | string | Under 200 characters |
| `category` | Yes | string | Must match parent directory name |
| `risk` | Yes | enum | `safe`, `unknown`, `critical` |
| `source` | Yes | enum | `community`, `personal`, `curated` |
| `date_added` | Yes | string | ISO date (YYYY-MM-DD) |
| `date_modified` | No | string | ISO date, set when content changes |
| `tags` | Yes | array | Keywords for search |
| `triggers` | No | array | Natural language phrases for AI matching |
| `tools` | Yes | array | `claude-code`, `cursor`, `gemini-cli`, `copilot`, `codex-cli`, `kiro`, `opencode` |
| `platforms` | Yes | array | E-commerce platforms or `platform-agnostic` |
| `difficulty` | Yes | enum | `beginner`, `intermediate`, `advanced` |

## Content Sections

1. **Title** (H1) — clear, descriptive
2. **Overview** — 2-4 sentences, focus on outcomes
3. **When to Use This Skill** — bullet list of trigger scenarios
4. **Core Instructions** — numbered steps with actionable guidance
5. **Examples** — code samples in fenced blocks
6. **Best Practices** — do's and don'ts
7. **Common Pitfalls** — problem-solution pairs
8. **Related Skills** — cross-references using `@skill-name`
```

- [ ] **Step 4: Create quality-bar.md**

Create `docs/contributors/quality-bar.md`:

```markdown
# Quality Bar

## Minimum Requirements (must have)

- [ ] Valid YAML frontmatter with all required fields
- [ ] `name` matches directory name
- [ ] `category` matches parent directory
- [ ] Description under 200 characters
- [ ] Overview section (2-4 sentences)
- [ ] When to Use This Skill section (3+ bullet points)
- [ ] Core Instructions section (numbered steps)
- [ ] Examples section (at least one code sample)
- [ ] `npm run validate` passes

## Recommended (should have)

- [ ] Best Practices section
- [ ] Common Pitfalls section
- [ ] Related Skills section with valid `@skill-name` references
- [ ] Tessl eval scenarios in `evals/` directory
- [ ] Eval score gap >= 15% over baseline

## Style Guidelines

- Write for developers who are skilled but unfamiliar with the e-commerce domain
- Lead with practical, actionable instructions — not theory
- Include real-world code examples, not toy snippets
- Use platform-agnostic patterns where possible, with platform-specific notes where needed
```

- [ ] **Step 5: Create user docs**

Create `docs/users/getting-started.md`:

```markdown
# Getting Started

## Install a Skill

**Via Tessl:**
```sh
curl -fsSL https://get.tessl.io | sh
tessl install awesome-ecommerce/stripe-integration
```

**Manual:**
```sh
git clone https://github.com/YOUR_USERNAME/awesome-ecommerce-skills.git
cp -r awesome-ecommerce-skills/skills/payments-checkout/stripe-integration .claude/skills/
```

## Use a Skill

In your AI coding assistant, reference the skill with `@skill-name`:

```
@stripe-integration Set up Stripe payment intents for my Next.js checkout
```

## Browse Skills

- [Full catalog](../../CATALOG.md)
- [Curated bundles](bundles.md)
```

Create `docs/users/bundles.md`:

```markdown
# Curated Bundles

Bundles are role-based skill groupings. Install a bundle to get all the skills a specific role needs.

| Bundle | For | Description |
|--------|-----|-------------|
| `store-builder` | Developers | Everything needed to build a store from scratch |
| `growth-marketer` | Marketers | SEO, email, CRO, analytics, and more |
| `platform-migrator` | Migration teams | Cross-platform skills for replatforming |
| `security-ops` | Security engineers | PCI, fraud, GDPR, and hardening |
| `headless-architect` | Architects | Composable commerce, APIs, headless patterns |
| `b2b-specialist` | B2B teams | Company accounts, quotes, catalogs, net terms |
| `marketplace-builder` | Marketplace devs | Multi-vendor, payouts, seller management |
| `common` | Everyone | Foundational skills every project needs |

See `data/bundles.json` for the full skill lists in each bundle.
```

- [ ] **Step 6: Create maintainer docs**

Create `docs/maintainers/release-process.md`:

```markdown
# Release Process

1. Ensure all skills validate: `npm run validate:strict`
2. Regenerate catalog: `npm run chain`
3. Update `CHANGELOG.md` with new skills and changes
4. Bump version in `package.json`
5. Commit: `git commit -m "release: vX.Y.Z"`
6. Tag: `git tag vX.Y.Z`
7. Push: `git push && git push --tags`
```

- [ ] **Step 7: Create CHANGELOG.md**

Create `CHANGELOG.md`:

```markdown
# Changelog

## [1.0.0] - 2026-03-12

### Added
- Initial release with 132 e-commerce skills across 17 categories
- Validation tooling (`npm run validate`)
- Catalog generation (`npm run catalog`)
- README generation (`npm run readme`)
- CI pipeline with Tessl skill review
- Tessl eval workflow
- Contributing guide and skill template
- Curated bundles and workflows
```

- [ ] **Step 8: Commit**

```bash
git add CONTRIBUTING.md CHANGELOG.md docs/
git commit -m "docs: add contributing guide, skill template, quality bar, and user/maintainer docs"
```

---

### Task 8: Static Data Files

**Files:**
- Create: `data/aliases.json`
- Create: `data/bundles.json`
- Create: `data/workflows.json`

- [ ] **Step 1: Create aliases.json**

Create `data/aliases.json` with common shorthand abbreviations for the most frequently referenced skills:

```json
{
  "checkout": "skills/payments-checkout/checkout-flow-optimization",
  "stripe": "skills/payments-checkout/stripe-integration",
  "paypal": "skills/payments-checkout/paypal-integration",
  "cart": "skills/payments-checkout/cart-logic",
  "seo": "skills/marketing-growth/ecommerce-seo",
  "email": "skills/marketing-growth/email-marketing-automation",
  "abandonment": "skills/marketing-growth/cart-abandonment-recovery",
  "reviews": "skills/customer-crm/product-reviews-ratings",
  "shipping": "skills/fulfillment-shipping/shipping-rate-calculator",
  "returns": "skills/fulfillment-shipping/returns-management",
  "tracking": "skills/fulfillment-shipping/shipment-tracking",
  "discounts": "skills/pricing-promotions/discount-engine",
  "coupons": "skills/pricing-promotions/coupon-management",
  "loyalty": "skills/pricing-promotions/loyalty-points-system",
  "gift-cards": "skills/pricing-promotions/gift-cards",
  "inventory": "skills/catalog-inventory/inventory-tracking",
  "variants": "skills/catalog-inventory/variant-matrix",
  "product-model": "skills/catalog-inventory/product-data-modeling",
  "shopify-app": "skills/platform-shopify/shopify-app-development",
  "shopify-theme": "skills/platform-shopify/shopify-theme-development",
  "shopify-api": "skills/platform-shopify/shopify-admin-api",
  "woo-plugin": "skills/platform-woocommerce/woocommerce-plugin-development",
  "woo-api": "skills/platform-woocommerce/woocommerce-rest-api",
  "magento-module": "skills/platform-magento/magento-module-development",
  "medusa": "skills/headless-modern/medusa-development",
  "saleor": "skills/headless-modern/saleor-development",
  "hydrogen": "skills/headless-modern/shopify-hydrogen",
  "composable": "skills/headless-modern/composable-commerce",
  "pci": "skills/security-compliance/pci-dss-compliance",
  "fraud": "skills/security-compliance/fraud-detection",
  "gdpr": "skills/security-compliance/gdpr-ecommerce",
  "caching": "skills/infrastructure-performance/ecommerce-caching",
  "erp": "skills/integrations-apis/erp-integration",
  "marketplace": "skills/business-operations/marketplace-building",
  "b2b": "skills/business-operations/b2b-commerce",
  "oms": "skills/business-operations/order-management-system",
  "cro": "skills/marketing-growth/conversion-rate-optimization",
  "personalization": "skills/customer-crm/personalization-engine",
  "segmentation": "skills/customer-crm/customer-segmentation",
  "subscriptions": "skills/payments-checkout/subscription-billing",
  "tax": "skills/payments-checkout/tax-calculation",
  "currency": "skills/payments-checkout/multi-currency",
  "bnpl": "skills/payments-checkout/buy-now-pay-later",
  "flash-sale": "skills/pricing-promotions/flash-sale-engine",
  "dynamic-pricing": "skills/pricing-promotions/dynamic-pricing",
  "dropship": "skills/fulfillment-shipping/dropshipping-integration",
  "clv": "skills/customer-crm/customer-lifetime-value",
  "referral": "skills/customer-crm/referral-program",
  "affiliate": "skills/marketing-growth/affiliate-program",
  "google-feed": "skills/marketing-growth/google-shopping-feed",
  "social": "skills/marketing-growth/social-commerce",
  "push": "skills/marketing-growth/push-notifications",
  "sms": "skills/marketing-growth/sms-marketing",
  "analytics": "skills/data-analytics/customer-analytics",
  "ab-test": "skills/data-analytics/ab-testing-ecommerce",
  "data-warehouse": "skills/data-analytics/ecommerce-data-warehouse",
  "webhooks": "skills/integrations-apis/webhook-architecture",
  "pim": "skills/integrations-apis/product-information-management",
  "pos": "skills/integrations-apis/pos-integration"
}
```

- [ ] **Step 2: Create bundles.json**

Create `data/bundles.json`:

```json
{
  "common": [
    "product-data-modeling", "cart-logic", "checkout-flow-optimization",
    "customer-accounts", "ecommerce-seo", "shipping-rate-calculator",
    "discount-engine", "inventory-tracking", "product-page-design",
    "order-processing-pipeline", "stripe-integration", "webhook-architecture",
    "monitoring-alerting-commerce", "secure-checkout", "analytics-integration"
  ],
  "store-builder": [
    "product-data-modeling", "variant-matrix", "inventory-tracking",
    "catalog-import-export", "product-categorization", "product-page-design",
    "search-autocomplete", "faceted-navigation", "responsive-storefront",
    "checkout-flow-optimization", "stripe-integration", "cart-logic",
    "guest-checkout", "order-processing-pipeline", "tax-calculation",
    "multi-currency", "discount-engine", "coupon-management",
    "shipping-rate-calculator", "returns-management", "shipment-tracking",
    "free-shipping-thresholds", "customer-accounts", "product-reviews-ratings",
    "ecommerce-seo", "email-marketing-automation", "cart-abandonment-recovery",
    "analytics-integration", "image-optimization-cdn", "secure-checkout",
    "account-security", "webhook-architecture", "monitoring-alerting-commerce",
    "storefront-theming", "accessibility-commerce", "wishlist-save-for-later",
    "recently-viewed-products", "product-comparison", "quick-view-modal",
    "mega-menu-builder", "sales-reporting-dashboard"
  ],
  "growth-marketer": [
    "ecommerce-seo", "email-marketing-automation", "cart-abandonment-recovery",
    "social-commerce", "google-shopping-feed", "conversion-rate-optimization",
    "push-notifications", "affiliate-program", "content-commerce",
    "sms-marketing", "influencer-tracking", "exit-intent-popups",
    "customer-segmentation", "personalization-engine", "customer-lifetime-value",
    "referral-program", "ab-testing-ecommerce", "attribution-modeling",
    "loyalty-points-system", "dynamic-pricing", "flash-sale-engine",
    "product-reviews-ratings", "user-generated-content", "sales-reporting-dashboard",
    "customer-analytics"
  ],
  "platform-migrator": [
    "product-data-modeling", "catalog-import-export", "variant-matrix",
    "product-categorization", "inventory-tracking", "multi-warehouse",
    "checkout-flow-optimization", "order-processing-pipeline", "tax-calculation",
    "multi-currency", "discount-engine", "coupon-management",
    "shipping-rate-calculator", "customer-accounts", "product-reviews-ratings",
    "shopify-storefront-api", "shopify-admin-api", "shopify-webhooks",
    "woocommerce-rest-api", "magento-graphql", "sfcc-ocapi-scapi",
    "composable-commerce", "commerce-api-gateway", "webhook-architecture",
    "erp-integration", "analytics-integration", "ecommerce-data-warehouse",
    "medusa-development", "saleor-development", "shopify-hydrogen"
  ],
  "security-ops": [
    "pci-dss-compliance", "fraud-detection", "gdpr-ecommerce",
    "bot-protection", "secure-checkout", "account-security",
    "data-retention-policies", "webhook-architecture",
    "monitoring-alerting-commerce", "load-testing-commerce",
    "ecommerce-caching", "order-processing-pipeline",
    "stripe-integration", "paypal-integration", "subscription-billing"
  ],
  "headless-architect": [
    "composable-commerce", "jamstack-storefront", "commerce-api-gateway",
    "pwa-storefront", "medusa-development", "saleor-development",
    "shopify-hydrogen", "commerce-js-integration",
    "shopify-storefront-api", "shopify-admin-api",
    "woocommerce-rest-api", "magento-graphql", "sfcc-ocapi-scapi",
    "ecommerce-caching", "edge-commerce", "image-optimization-cdn",
    "webhook-architecture", "analytics-integration",
    "database-optimization-commerce", "flash-sale-scaling"
  ],
  "b2b-specialist": [
    "b2b-commerce", "volume-pricing", "price-rules-engine",
    "customer-segmentation", "customer-accounts", "multi-warehouse",
    "order-management-system", "vendor-management", "erp-integration",
    "product-information-management", "catalog-import-export",
    "multi-channel-selling", "tax-calculation", "subscription-billing"
  ],
  "marketplace-builder": [
    "marketplace-building", "vendor-management", "multi-channel-selling",
    "order-management-system", "shipping-rate-calculator", "returns-management",
    "dropshipping-integration", "product-data-modeling", "product-categorization",
    "search-autocomplete", "faceted-navigation", "discount-engine",
    "coupon-management", "customer-accounts", "product-reviews-ratings",
    "fraud-detection", "webhook-architecture", "analytics-integration",
    "stripe-integration", "subscription-billing"
  ]
}
```

- [ ] **Step 3: Create workflows.json**

Create `data/workflows.json`:

```json
{
  "workflows": [
    {
      "id": "launch-dtc-store",
      "title": "Launch a DTC Store",
      "description": "End-to-end journey from product modeling to storefront launch",
      "steps": [
        { "title": "Model your catalog", "goal": "Define product schema, variants, and categories", "recommendedSkills": ["product-data-modeling", "variant-matrix", "product-categorization"], "notes": "Start here — everything else depends on your data model" },
        { "title": "Build the storefront", "goal": "Create product pages, navigation, and search", "recommendedSkills": ["product-page-design", "search-autocomplete", "faceted-navigation", "responsive-storefront"], "notes": "Mobile-first, optimize for Core Web Vitals" },
        { "title": "Implement checkout", "goal": "Cart, payment, and order processing", "recommendedSkills": ["cart-logic", "checkout-flow-optimization", "stripe-integration", "guest-checkout"], "notes": "Guest checkout first, accounts optional" },
        { "title": "Set up shipping", "goal": "Rates, tracking, and returns", "recommendedSkills": ["shipping-rate-calculator", "shipment-tracking", "free-shipping-thresholds"], "notes": "Start with flat rate, add real-time rates later" },
        { "title": "Configure tax", "goal": "Tax calculation and compliance", "recommendedSkills": ["tax-calculation"], "notes": "Use a tax service (TaxJar/Avalara) from day one" },
        { "title": "Add promotions", "goal": "Discounts, coupons, and pricing", "recommendedSkills": ["discount-engine", "coupon-management"], "notes": "Keep rules simple at launch" },
        { "title": "Launch marketing", "goal": "SEO, email, and abandonment recovery", "recommendedSkills": ["ecommerce-seo", "email-marketing-automation", "cart-abandonment-recovery", "analytics-integration"], "notes": "Set up tracking before launch" },
        { "title": "Harden and launch", "goal": "Security, monitoring, and go-live", "recommendedSkills": ["secure-checkout", "monitoring-alerting-commerce", "load-testing-commerce"], "notes": "Load test before launch day" }
      ]
    },
    {
      "id": "migrate-to-headless",
      "title": "Migrate to Headless",
      "description": "Replatform from monolith to composable/headless architecture",
      "steps": [
        { "title": "Audit current platform", "goal": "Map features, integrations, and data", "recommendedSkills": ["composable-commerce", "product-data-modeling"], "notes": "Document every integration and custom feature" },
        { "title": "Design API layer", "goal": "Choose headless backend and define API contracts", "recommendedSkills": ["commerce-api-gateway", "medusa-development", "saleor-development"], "notes": "Evaluate Medusa, Saleor, and Shopify Hydrogen" },
        { "title": "Build new storefront", "goal": "Implement headless frontend", "recommendedSkills": ["jamstack-storefront", "pwa-storefront", "shopify-hydrogen"], "notes": "Start with critical path: PDP, PLP, cart, checkout" },
        { "title": "Migrate data", "goal": "Transfer products, customers, and orders", "recommendedSkills": ["catalog-import-export", "product-data-modeling", "webhook-architecture"], "notes": "Run parallel systems during migration" },
        { "title": "Reconnect integrations", "goal": "ERP, email, analytics, and payments", "recommendedSkills": ["erp-integration", "analytics-integration", "stripe-integration", "email-service-integration"], "notes": "Test each integration independently" },
        { "title": "Cutover", "goal": "DNS switch, monitoring, and rollback plan", "recommendedSkills": ["monitoring-alerting-commerce", "ecommerce-caching", "edge-commerce"], "notes": "Have a rollback plan; do a soft launch first" }
      ]
    },
    {
      "id": "black-friday-prep",
      "title": "Black Friday Prep",
      "description": "Prepare your store for peak traffic and flash sales",
      "steps": [
        { "title": "Load test", "goal": "Simulate peak traffic patterns", "recommendedSkills": ["load-testing-commerce", "database-optimization-commerce"], "notes": "Test at 3x expected peak" },
        { "title": "Scale infrastructure", "goal": "Auto-scaling, CDN, and caching", "recommendedSkills": ["flash-sale-scaling", "ecommerce-caching", "image-optimization-cdn", "edge-commerce"], "notes": "Pre-warm caches and CDN" },
        { "title": "Prepare flash sales", "goal": "Configure time-limited deals", "recommendedSkills": ["flash-sale-engine", "discount-engine", "coupon-management"], "notes": "Test discount stacking rules" },
        { "title": "Set up monitoring", "goal": "Real-time dashboards and alerts", "recommendedSkills": ["monitoring-alerting-commerce", "sales-reporting-dashboard"], "notes": "Alert on checkout error rate, not just uptime" },
        { "title": "Incident response plan", "goal": "Runbooks for common failures", "recommendedSkills": ["bot-protection", "fraud-detection", "secure-checkout"], "notes": "Have kill switches for features that can be shed" }
      ]
    },
    {
      "id": "build-marketplace",
      "title": "Build a Marketplace",
      "description": "Multi-vendor marketplace from architecture to launch",
      "steps": [
        { "title": "Design multi-vendor architecture", "goal": "Tenant model, data isolation, and routing", "recommendedSkills": ["marketplace-building", "product-data-modeling", "order-management-system"], "notes": "Decide: shared catalog vs isolated catalogs" },
        { "title": "Build seller onboarding", "goal": "Registration, verification, and catalog upload", "recommendedSkills": ["vendor-management", "catalog-import-export", "customer-accounts"], "notes": "KYC/KYB verification is critical" },
        { "title": "Implement payouts", "goal": "Commission calculation and seller payments", "recommendedSkills": ["stripe-integration", "subscription-billing"], "notes": "Stripe Connect or equivalent for marketplace payouts" },
        { "title": "Build unified catalog", "goal": "Search, navigation, and product display", "recommendedSkills": ["search-autocomplete", "faceted-navigation", "product-categorization", "product-page-design"], "notes": "Normalize product data across sellers" },
        { "title": "Order routing and fulfillment", "goal": "Split orders and multi-seller fulfillment", "recommendedSkills": ["order-management-system", "shipping-rate-calculator", "shipment-tracking", "returns-management"], "notes": "Handle split-shipment returns gracefully" },
        { "title": "Reviews and trust", "goal": "Seller ratings and buyer protection", "recommendedSkills": ["product-reviews-ratings", "fraud-detection", "customer-support-integration"], "notes": "Two-sided review system" },
        { "title": "Analytics and reporting", "goal": "Seller dashboards and marketplace metrics", "recommendedSkills": ["sales-reporting-dashboard", "analytics-integration", "customer-analytics"], "notes": "Separate seller vs platform analytics" }
      ]
    },
    {
      "id": "commerce-security-audit",
      "title": "Commerce Security Audit",
      "description": "Comprehensive security assessment for e-commerce",
      "steps": [
        { "title": "PCI-DSS assessment", "goal": "Evaluate payment data handling", "recommendedSkills": ["pci-dss-compliance", "secure-checkout"], "notes": "Determine SAQ level first" },
        { "title": "Fraud review", "goal": "Assess fraud detection and prevention", "recommendedSkills": ["fraud-detection", "bot-protection"], "notes": "Review chargeback rates and patterns" },
        { "title": "Privacy compliance", "goal": "GDPR, CCPA, and data retention audit", "recommendedSkills": ["gdpr-ecommerce", "data-retention-policies"], "notes": "Map all PII data flows" },
        { "title": "Application security", "goal": "XSS, CSRF, injection, and auth review", "recommendedSkills": ["secure-checkout", "account-security"], "notes": "Focus on checkout and account flows" },
        { "title": "Infrastructure hardening", "goal": "Network, monitoring, and incident response", "recommendedSkills": ["monitoring-alerting-commerce", "ecommerce-caching", "load-testing-commerce"], "notes": "Review WAF rules and rate limiting" }
      ]
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "feat: add aliases, bundles, and workflows data files"
```

---

## Chunk 3: Exemplar Skill & Category Scaffolding

### Task 9: Create Exemplar Skill

This is the reference implementation that all other skills follow. Write it with full depth.

**Files:**
- Create: `skills/payments-checkout/stripe-integration/SKILL.md`

- [ ] **Step 1: Create the exemplar skill**

Create `skills/payments-checkout/stripe-integration/SKILL.md` — this must be the highest quality skill in the repo, serving as the gold standard:

```markdown
---
name: stripe-integration
description: "Stripe payment intents, subscriptions, webhooks, and SCA compliance"
category: payments-checkout
risk: critical
source: curated
date_added: "2026-03-12"
tags: [stripe, payments, checkout, webhooks, sca, pci, subscriptions]
triggers: ["integrate stripe", "add stripe payments", "stripe checkout", "payment processing"]
tools: [claude-code, cursor, gemini-cli, copilot, codex-cli, kiro, opencode]
platforms: [platform-agnostic]
difficulty: intermediate
---

# Stripe Integration

## Overview

Implement Stripe payment processing with Payment Intents API for one-time payments, Stripe Checkout for hosted flows, and webhooks for reliable server-side event handling. Covers SCA (Strong Customer Authentication) compliance for European transactions and PCI-DSS scope reduction through client-side tokenization.

## When to Use This Skill

- When adding payment processing to a new e-commerce application
- When migrating from legacy Stripe Charges API to Payment Intents
- When implementing SCA-compliant checkout for European customers
- When setting up webhook handlers for order fulfillment automation
- When adding subscription billing to an existing store

## Core Instructions

1. **Install Stripe SDK and configure keys**

   Server-side (Node.js):
   ```bash
   npm install stripe
   ```

   ```javascript
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   ```

   Client-side — use Stripe.js (always load from Stripe's CDN, never bundle):
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```

   ```javascript
   const stripe = Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
   ```

2. **Create a Payment Intent on the server**

   ```javascript
   // POST /api/create-payment-intent
   export async function createPaymentIntent(req, res) {
     const { amount, currency, metadata } = req.body;

     const paymentIntent = await stripe.paymentIntents.create({
       amount,              // Amount in smallest currency unit (cents)
       currency,            // 'usd', 'eur', 'gbp', etc.
       automatic_payment_methods: { enabled: true },
       metadata: {
         order_id: metadata.orderId,
         customer_email: metadata.email,
       },
     });

     res.json({ clientSecret: paymentIntent.client_secret });
   }
   ```

3. **Confirm payment on the client**

   ```javascript
   const { error } = await stripe.confirmPayment({
     elements,
     confirmParams: {
       return_url: `${window.location.origin}/order/confirmation`,
     },
   });

   if (error) {
     // Show error to customer (e.g., insufficient funds, card declined)
     showError(error.message);
   }
   // If no error, customer is redirected to return_url
   ```

4. **Handle webhooks for fulfillment**

   ```javascript
   // POST /api/webhooks/stripe
   export async function handleStripeWebhook(req, res) {
     const sig = req.headers['stripe-signature'];
     let event;

     try {
       event = stripe.webhooks.constructEvent(
         req.body,    // Raw body — do NOT parse as JSON
         sig,
         process.env.STRIPE_WEBHOOK_SECRET
       );
     } catch (err) {
       return res.status(400).send(`Webhook Error: ${err.message}`);
     }

     switch (event.type) {
       case 'payment_intent.succeeded':
         await fulfillOrder(event.data.object);
         break;
       case 'payment_intent.payment_failed':
         await notifyPaymentFailed(event.data.object);
         break;
       case 'charge.refunded':
         await processRefund(event.data.object);
         break;
     }

     res.json({ received: true });
   }
   ```

5. **Make webhook handlers idempotent**

   ```javascript
   async function fulfillOrder(paymentIntent) {
     const orderId = paymentIntent.metadata.order_id;

     // Check if already fulfilled — webhooks can be delivered multiple times
     const order = await db.orders.findById(orderId);
     if (order.status === 'fulfilled') return;

     await db.orders.update(orderId, { status: 'fulfilled', paidAt: new Date() });
     await sendOrderConfirmationEmail(order);
   }
   ```

6. **Set up Stripe CLI for local webhook testing**

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # Copy the webhook signing secret from the output
   ```

## Examples

### Stripe Checkout (hosted payment page)

For the simplest integration — Stripe hosts the entire checkout UI:

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: { name: 'T-Shirt', description: 'Comfortable cotton tee' },
        unit_amount: 2000,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${YOUR_DOMAIN}/canceled`,
  metadata: { order_id: orderId },
});

// Redirect customer to session.url
```

### Subscription with trial

```javascript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_pro' }],
  trial_period_days: 14,
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

## Best Practices

- **Always use Payment Intents** — the Charges API is legacy and doesn't support SCA
- **Never log or store raw card numbers** — use Stripe Elements or Checkout to stay out of PCI scope
- **Use webhook events for fulfillment** — don't rely on the client-side redirect alone (customers can close the browser)
- **Make all webhook handlers idempotent** — Stripe may deliver the same event multiple times
- **Use metadata** — attach your `order_id` to every Payment Intent for easy reconciliation
- **Test with Stripe's test cards** — use `4242424242424242` for success, `4000000000003220` for 3DS challenge
- **Set up Stripe Tax** if selling to multiple jurisdictions — avoid building tax logic yourself

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| Webhook signature verification fails | Ensure you pass the **raw request body** (not parsed JSON) to `constructEvent` |
| Double-charging customers | Always check for existing Payment Intents before creating new ones for the same order |
| 3DS challenges not working | Use `automatic_payment_methods` instead of manually specifying payment method types |
| Webhooks not received locally | Use `stripe listen --forward-to` for local development |
| Currency amount wrong | Stripe uses smallest currency unit — $20.00 = `2000` cents |
| Refund fails with "charge already refunded" | Make refund handlers idempotent — check refund status before attempting |

## Related Skills

- @checkout-flow-optimization
- @subscription-billing
- @pci-dss-compliance
- @webhook-architecture
- @order-processing-pipeline
```

- [ ] **Step 2: Validate the exemplar**

```bash
npm run validate
```

Expected: 1 skill validated, 0 errors.

- [ ] **Step 3: Generate catalog to verify end-to-end tooling**

```bash
npm run chain
```

Expected: Validation passes, catalog generated with 1 skill, README generated.

- [ ] **Step 4: Commit**

```bash
git add skills/ data/ CATALOG.md README.md
git commit -m "feat: add exemplar skill (stripe-integration) and verify end-to-end tooling"
```

---

### Task 10: Create All 17 Category Directories with One Skill Each

Before mass-generating skills, scaffold every category with one skill to validate the full structure. Use the spec's skill list — pick the first skill from each category.

**Files:**
- Create: 16 more `SKILL.md` files (one per remaining category), each with full content

- [ ] **Step 1: Create one skill per category**

For each of these 16 categories (payments-checkout already has stripe-integration), create a full-quality SKILL.md following the exemplar pattern. Each skill should have: Overview (2-4 sentences), When to Use (4+ bullets), Core Instructions (5+ numbered steps with code), Examples (2+ code blocks), Best Practices (5+ bullets), Common Pitfalls (4+ rows), Related Skills (3+ refs).

Skills to create (first from each category per spec):

| Category | Skill | Description |
|----------|-------|-------------|
| `storefront-ui` | `product-page-design` | High-converting product page layouts |
| `catalog-inventory` | `product-data-modeling` | Schema design for products with variants |
| `pricing-promotions` | `discount-engine` | Rule-based discount system |
| `fulfillment-shipping` | `shipping-rate-calculator` | Real-time rate calculation with carrier APIs |
| `customer-crm` | `customer-accounts` | Registration, profile, address book, order history |
| `marketing-growth` | `ecommerce-seo` | Product page SEO, structured data, sitemaps |
| `platform-shopify` | `shopify-theme-development` | Liquid templating, theme architecture |
| `platform-woocommerce` | `woocommerce-plugin-development` | Custom WooCommerce plugins |
| `platform-magento` | `magento-module-development` | Custom Magento 2 modules |
| `platform-salesforce-cc` | `sfcc-cartridge-development` | SFRA cartridge architecture |
| `headless-modern` | `medusa-development` | Medusa.js setup and extensions |
| `security-compliance` | `pci-dss-compliance` | PCI-DSS requirements and implementation |
| `infrastructure-performance` | `ecommerce-caching` | Multi-layer caching for commerce |
| `integrations-apis` | `erp-integration` | ERP sync patterns |
| `data-analytics` | `ecommerce-data-warehouse` | Data warehouse design for commerce |
| `business-operations` | `merchandising-rules` | Visual merchandising and product ranking |

Each skill must follow the exact SKILL.md format with valid frontmatter. Use the spec descriptions for the `description` field. Set `source: curated`, `date_added: "2026-03-12"`, and appropriate `risk`, `tags`, `tools`, `platforms`, `difficulty` values per the spec.

- [ ] **Step 2: Validate all skills**

```bash
npm run validate:strict
```

Expected: 17 skills validated, 0 errors.

- [ ] **Step 3: Regenerate catalog**

```bash
npm run chain
```

Expected: catalog.json shows 17 skills across 17 categories.

- [ ] **Step 4: Commit**

```bash
git add skills/ data/ CATALOG.md README.md
git commit -m "feat: scaffold all 17 categories with one skill each (17 total)"
```

---

## Chunk 4: Skill Authoring — Batches 1-3 (Core Commerce, Operations, Growth)

### Task 11: Batch 1 — Core Commerce (remaining skills)

Create the remaining skills for Storefront & UI (11), Catalog & Inventory (9), and Payments & Checkout (9) — 29 skills total. Each follows the exemplar pattern.

**This task is parallelizable by category.** Each category can be authored by a separate subagent.

**Files:**
- Create: 29 `SKILL.md` files across 3 categories

Skills to create (excluding the ones already created in Task 10):

**Storefront & UI** (11 remaining): `search-autocomplete`, `faceted-navigation`, `mega-menu-builder`, `responsive-storefront`, `quick-view-modal`, `image-zoom-360`, `wishlist-save-for-later`, `recently-viewed-products`, `product-comparison`, `accessibility-commerce`, `storefront-theming`

**Catalog & Inventory** (9 remaining): `variant-matrix`, `inventory-tracking`, `catalog-import-export`, `product-categorization`, `digital-products`, `product-bundles-kits`, `multi-warehouse`, `low-stock-alerts`, `product-content-enrichment`

**Payments & Checkout** (9 remaining): `checkout-flow-optimization`, `paypal-integration`, `cart-logic`, `guest-checkout`, `order-processing-pipeline`, `tax-calculation`, `multi-currency`, `buy-now-pay-later`, `subscription-billing`

Each skill must have all required frontmatter fields, Overview, When to Use, Core Instructions (with code examples), Examples, Best Practices, and Common Pitfalls. Reference the spec for descriptions and difficulty levels.

- [ ] **Step 1: Create all 29 skills**
- [ ] **Step 2: Validate** — `npm run validate:strict` — Expected: 0 errors
- [ ] **Step 3: Regenerate catalog** — `npm run chain`
- [ ] **Step 4: Commit**

```bash
git add skills/storefront-ui/ skills/catalog-inventory/ skills/payments-checkout/ data/ CATALOG.md README.md
git commit -m "feat: add 29 core commerce skills (storefront, catalog, payments)"
```

---

### Task 12: Batch 2 — Operations

Create skills for Pricing & Promotions (8), Fulfillment & Shipping (7), and Business Operations (7) — 22 skills total.

**Files:**
- Create: 22 `SKILL.md` files across 3 categories

**Pricing & Promotions** (8 remaining): `coupon-management`, `dynamic-pricing`, `flash-sale-engine`, `loyalty-points-system`, `volume-pricing`, `gift-cards`, `price-rules-engine`, `ab-testing-pricing`

**Fulfillment & Shipping** (7 remaining): `order-fulfillment-workflow`, `returns-management`, `shipment-tracking`, `free-shipping-thresholds`, `dropshipping-integration`, `same-day-delivery`, `international-shipping`

**Business Operations** (7 remaining): `vendor-management`, `multi-channel-selling`, `b2b-commerce`, `order-management-system`, `returns-refund-policy`, `demand-forecasting`, `marketplace-building`

- [ ] **Step 1: Create all 22 skills**
- [ ] **Step 2: Validate** — `npm run validate:strict`
- [ ] **Step 3: Regenerate catalog** — `npm run chain`
- [ ] **Step 4: Commit**

```bash
git add skills/pricing-promotions/ skills/fulfillment-shipping/ skills/business-operations/ data/ CATALOG.md README.md
git commit -m "feat: add 22 operations skills (pricing, fulfillment, business)"
```

---

### Task 13: Batch 3 — Growth

Create skills for Marketing & Growth (11), Customer & CRM (8), and Data & Analytics (5) — 24 skills total.

**Files:**
- Create: 24 `SKILL.md` files across 3 categories

**Marketing & Growth** (11 remaining): `email-marketing-automation`, `cart-abandonment-recovery`, `social-commerce`, `google-shopping-feed`, `conversion-rate-optimization`, `push-notifications`, `affiliate-program`, `content-commerce`, `sms-marketing`, `influencer-tracking`, `exit-intent-popups`

**Customer & CRM** (8 remaining): `product-reviews-ratings`, `customer-segmentation`, `personalization-engine`, `customer-support-integration`, `live-chat-commerce`, `user-generated-content`, `referral-program`, `customer-lifetime-value`

**Data & Analytics** (5 remaining): `sales-reporting-dashboard`, `product-analytics`, `customer-analytics`, `ab-testing-ecommerce`, `attribution-modeling`

- [ ] **Step 1: Create all 24 skills**
- [ ] **Step 2: Validate** — `npm run validate:strict`
- [ ] **Step 3: Regenerate catalog** — `npm run chain`
- [ ] **Step 4: Commit**

```bash
git add skills/marketing-growth/ skills/customer-crm/ skills/data-analytics/ data/ CATALOG.md README.md
git commit -m "feat: add 24 growth skills (marketing, CRM, analytics)"
```

---

## Chunk 5: Skill Authoring — Batches 4-5 (Platform-Specific & Advanced)

### Task 14: Batch 4 — Platform-Specific

Create skills for Shopify (6), WooCommerce (4), Magento (3), and SFCC (2) — 15 skills total.

**Files:**
- Create: 15 `SKILL.md` files across 4 categories

**Shopify** (6 remaining): `shopify-app-development`, `shopify-storefront-api`, `shopify-admin-api`, `shopify-checkout-extensions`, `shopify-webhooks`, `shopify-metafields`

**WooCommerce** (4 remaining): `woocommerce-rest-api`, `woocommerce-blocks`, `woocommerce-subscriptions`, `woocommerce-performance`

**Magento** (3 remaining): `magento-graphql`, `magento-indexing-caching`, `magento-multi-store`

**SFCC** (2 remaining): `sfcc-ocapi-scapi`, `sfcc-business-manager`

- [ ] **Step 1: Create all 15 skills**
- [ ] **Step 2: Validate** — `npm run validate:strict`
- [ ] **Step 3: Regenerate catalog** — `npm run chain`
- [ ] **Step 4: Commit**

```bash
git add skills/platform-shopify/ skills/platform-woocommerce/ skills/platform-magento/ skills/platform-salesforce-cc/ data/ CATALOG.md README.md
git commit -m "feat: add 15 platform-specific skills (Shopify, WooCommerce, Magento, SFCC)"
```

---

### Task 15: Batch 5 — Advanced (Headless, Security, Infrastructure, Integrations)

Create skills for Headless (7), Security (6), Infrastructure (6), and Integrations (6) — 25 skills total.

**Files:**
- Create: 25 `SKILL.md` files across 4 categories

**Headless & Modern** (7 remaining): `saleor-development`, `shopify-hydrogen`, `composable-commerce`, `jamstack-storefront`, `commerce-api-gateway`, `pwa-storefront`, `commerce-js-integration`

**Security & Compliance** (6 remaining): `fraud-detection`, `gdpr-ecommerce`, `bot-protection`, `secure-checkout`, `account-security`, `data-retention-policies`

**Infrastructure & Performance** (6 remaining): `image-optimization-cdn`, `flash-sale-scaling`, `database-optimization-commerce`, `monitoring-alerting-commerce`, `edge-commerce`, `load-testing-commerce`

**Integrations & APIs** (6 remaining): `marketplace-connectors`, `webhook-architecture`, `product-information-management`, `email-service-integration`, `analytics-integration`, `pos-integration`

- [ ] **Step 1: Create all 25 skills**
- [ ] **Step 2: Validate** — `npm run validate:strict`
- [ ] **Step 3: Regenerate catalog** — `npm run chain`
- [ ] **Step 4: Commit**

```bash
git add skills/headless-modern/ skills/security-compliance/ skills/infrastructure-performance/ skills/integrations-apis/ data/ CATALOG.md README.md
git commit -m "feat: add 25 advanced skills (headless, security, infrastructure, integrations)"
```

---

## Chunk 6: Final Assembly & Verification

### Task 16: Final Catalog Generation and Verification

- [ ] **Step 1: Run full validation**

```bash
npm run validate:strict
```

Expected: 132 skills validated, 0 errors.

- [ ] **Step 2: Regenerate all generated files**

```bash
npm run chain
```

Expected: catalog.json shows 132 skills, CATALOG.md has all 17 categories, README.md has correct counts.

- [ ] **Step 3: Verify catalog.json**

Check that `data/catalog.json` has `"total": 132` and all 17 categories are represented.

- [ ] **Step 4: Verify skills_index.json**

Check that `data/skills_index.json` has 132 entries.

- [ ] **Step 5: Verify README.md**

Check that the README shows 132 in the badge and all category rows.

- [ ] **Step 6: Verify CATALOG.md**

Check that CATALOG.md has tables for all 17 categories with correct skill counts.

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 8: Commit final generated files**

```bash
git add data/ CATALOG.md README.md
git commit -m "chore: final catalog generation — 132 skills across 17 categories"
```

---

### Task 17: Tessl Setup

- [ ] **Step 1: Install Tessl CLI**

```bash
curl -fsSL https://get.tessl.io | sh
```

- [ ] **Step 2: Generate eval scenarios for exemplar skill**

```bash
tessl scenario generate skills/payments-checkout/stripe-integration/SKILL.md --count=3
```

- [ ] **Step 3: Run eval on exemplar skill**

```bash
tessl eval run skills/payments-checkout/stripe-integration/SKILL.md
tessl eval view --last
```

Review the score gap. If < 15%, revise the skill and re-run.

- [ ] **Step 4: Batch-generate scenarios for high-priority skills**

Generate scenarios for the top 10 starter skills:

```bash
for skill in checkout-flow-optimization product-data-modeling ecommerce-seo cart-logic inventory-tracking shipping-rate-calculator customer-accounts discount-engine product-page-design; do
  dir=$(find skills -name "$skill" -type d)
  if [ -n "$dir" ]; then
    tessl scenario generate "$dir/SKILL.md" --count=3
  fi
done
```

- [ ] **Step 5: Commit eval scenarios**

```bash
git add skills/*/*/evals/
git commit -m "feat: add Tessl eval scenarios for top skills"
```

---

### Task 18: Create Initial Git Tag

- [ ] **Step 1: Create v1.0.0 tag**

```bash
git tag -a v1.0.0 -m "v1.0.0: Initial release — 132 e-commerce skills across 17 categories"
```

- [ ] **Step 2: Verify**

```bash
git log --oneline --decorate -10
```

Expected: Tag `v1.0.0` on latest commit.
