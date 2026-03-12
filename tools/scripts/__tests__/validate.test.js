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
