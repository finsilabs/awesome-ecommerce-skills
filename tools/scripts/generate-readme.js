import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
    lines.push(`| **${toTitleCase(category)}** \`${category}\` | ${skills.length} | ${skills.map(s => `\`@${s.id}\``).slice(0, 3).join(', ')}${skills.length > 3 ? ', ...' : ''} |`);
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
