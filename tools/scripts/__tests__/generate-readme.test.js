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
    assert.ok(readme.includes('Cat One'));
    assert.ok(readme.includes('Cat Two'));
  });

  it('includes getting started section', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('Getting Started'));
  });

  it('includes tessl install instructions', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('tessl install'));
  });

  it('includes contributing section', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('Contributing'));
  });

  it('includes what are skills section', () => {
    const readme = generateReadme(mockCatalog);
    assert.ok(readme.includes('What Are Skills?'));
  });

  it('includes eval results when provided', () => {
    const evalResults = [
      { skill: 'skill-a', baseline_avg: 60, with_context_avg: 95, lift: 35 },
      { skill: 'skill-b', baseline_avg: 50, with_context_avg: 90, lift: 40 },
    ];
    const readme = generateReadme(mockCatalog, evalResults);
    assert.ok(readme.includes('Eval Results'));
    assert.ok(readme.includes('Improvement'));
  });

  it('omits eval results when not provided', () => {
    const readme = generateReadme(mockCatalog, null);
    assert.ok(!readme.includes('Eval Results'));
  });
});
