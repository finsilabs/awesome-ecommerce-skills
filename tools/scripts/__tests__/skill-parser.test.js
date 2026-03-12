import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSkillFile, VALID_DIFFICULTIES, VALID_SOURCES, VALID_TOOLS, VALID_RISK_LEVELS } from '../../lib/skill-parser.js';
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
