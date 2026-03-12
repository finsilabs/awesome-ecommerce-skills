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
