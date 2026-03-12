import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCatalog, generateCatalogMd, generateSkillsIndex } from '../generate-catalog.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
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
