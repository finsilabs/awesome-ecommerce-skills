import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function toTitleCase(kebab) {
  return kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function generateReadme(catalog, evalResults) {
  // Group by category
  const byCategory = {};
  for (const skill of catalog.skills) {
    if (!byCategory[skill.category]) byCategory[skill.category] = [];
    byCategory[skill.category].push(skill);
  }

  const categoryCount = Object.keys(byCategory).length;

  // Build eval lookup
  const evalBySkill = {};
  if (evalResults) {
    for (const r of evalResults) {
      evalBySkill[r.skill] = r;
    }
  }

  // Compute eval stats
  const evalsWithData = evalResults ? evalResults.filter(r => r.lift != null) : [];
  const avgBaseline = evalsWithData.length > 0
    ? (evalsWithData.reduce((s, r) => s + r.baseline_avg, 0) / evalsWithData.length).toFixed(0)
    : null;
  const avgWithContext = evalsWithData.length > 0
    ? (evalsWithData.reduce((s, r) => s + r.with_context_avg, 0) / evalsWithData.length).toFixed(0)
    : null;
  const avgLift = evalsWithData.length > 0
    ? (evalsWithData.reduce((s, r) => s + r.lift, 0) / evalsWithData.length).toFixed(0)
    : null;

  const lines = [];

  // Header
  lines.push('# Awesome E-Commerce Skills');
  lines.push('');
  lines.push(`> A curated collection of ${catalog.total} ready-to-use e-commerce skills that make AI coding assistants dramatically better at building online stores.`);
  lines.push('');
  lines.push(`![Skills](https://img.shields.io/badge/skills-${catalog.total}-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)`);
  lines.push('');

  // What are skills
  lines.push('## What Are Skills?');
  lines.push('');
  lines.push('Skills are expert instructions that teach AI assistants how to do specific e-commerce tasks well. Think of them as cheat sheets — when your AI assistant has the right skill loaded, it writes better code, follows best practices, and makes fewer mistakes.');
  lines.push('');
  lines.push('**Without a skill**, an AI assistant gives you generic code that might miss critical details like webhook signature verification, idempotency handling, or PCI compliance requirements.');
  lines.push('');
  lines.push('**With a skill**, the same assistant produces production-ready code that follows industry best practices.');
  lines.push('');

  if (avgLift) {
    lines.push(`We tested every skill with [Tessl](https://tessl.io) automated evaluations. On average, skills improve AI output quality from **${avgBaseline}%** to **${avgWithContext}%** — a **+${avgLift}% improvement** across ${evalsWithData.length} skills.`);
    lines.push('');
  }

  lines.push('**Works with:** Claude Code, Cursor, Gemini CLI, GitHub Copilot, Codex CLI, Kiro, OpenCode, and any AI assistant that supports context files.');
  lines.push('');

  // TOC
  lines.push('## Table of Contents');
  lines.push('');
  lines.push('- [Getting Started](#getting-started)');
  lines.push('- [How It Works](#how-it-works)');
  if (avgLift) lines.push('- [Eval Results](#eval-results)');
  lines.push('- [Top 10 Starter Skills](#top-10-starter-skills)');
  lines.push('- [All Categories](#all-categories)');
  lines.push('- [Curated Bundles](#curated-bundles)');
  lines.push('- [Browse All Skills](#browse-all-skills)');
  lines.push('- [Contributing](#contributing)');
  lines.push('- [License](#license)');
  lines.push('');

  // Getting Started
  lines.push('## Getting Started');
  lines.push('');
  lines.push('### Option 1: Via Tessl (recommended)');
  lines.push('');
  lines.push('[Tessl](https://tessl.io) lets you install skills directly into your project with one command.');
  lines.push('');
  lines.push('```sh');
  lines.push('# Install the Tessl CLI');
  lines.push('curl -fsSL https://get.tessl.io | sh');
  lines.push('');
  lines.push('# Install any skill by name');
  lines.push('tessl install finsi/stripe-integration');
  lines.push('tessl install finsi/checkout-flow-optimization');
  lines.push('```');
  lines.push('');
  lines.push('### Option 2: Copy manually');
  lines.push('');
  lines.push('```sh');
  lines.push('# Clone this repository');
  lines.push('git clone https://github.com/finsilabs/awesome-ecommerce-skills.git');
  lines.push('');
  lines.push('# Copy any skill into your project\'s AI context folder');
  lines.push('cp -r awesome-ecommerce-skills/skills/payments-checkout/stripe-integration/SKILL.md \\');
  lines.push('  your-project/.claude/skills/');
  lines.push('```');
  lines.push('');
  lines.push('That\'s it. Your AI assistant will automatically use the skill the next time you ask it to work on that topic.');
  lines.push('');

  // How It Works
  lines.push('## How It Works');
  lines.push('');
  lines.push('```');
  lines.push('You: "Add Stripe payments to my checkout"');
  lines.push('');
  lines.push('AI without skill:              AI with skill:');
  lines.push('  Generic Stripe example         Production-ready Payment Intents');
  lines.push('  Missing webhook handling        Webhook signature verification');
  lines.push('  No error recovery              Idempotent event processing');
  lines.push('  Basic card form                SCA/3D Secure compliance');
  lines.push('```');
  lines.push('');
  lines.push('Each skill contains:');
  lines.push('- **When to use it** — so you know which skill fits your situation');
  lines.push('- **Step-by-step instructions** — that guide the AI through the implementation');
  lines.push('- **Best practices** — drawn from real-world e-commerce experience');
  lines.push('- **Common pitfalls** — things the AI would otherwise get wrong');
  lines.push('');

  // Eval Results
  if (avgLift && evalsWithData.length > 0) {
    lines.push('## Eval Results');
    lines.push('');
    lines.push('Every skill is tested using [Tessl](https://tessl.io) automated evaluations. Each eval gives an AI assistant a realistic e-commerce task, then scores the output against a detailed checklist. We run each task twice — once without the skill (baseline) and once with it — to measure the real improvement.');
    lines.push('');
    lines.push(`**Across ${evalsWithData.length} skills tested:**`);
    lines.push('');
    lines.push(`| | Score |`);
    lines.push(`|---|---|`);
    lines.push(`| Without skills (baseline) | ${avgBaseline}% |`);
    lines.push(`| With skills | ${avgWithContext}% |`);
    lines.push(`| **Improvement** | **+${avgLift}%** |`);
    lines.push('');

    // Top 10 by lift
    const top10 = [...evalsWithData].sort((a, b) => b.lift - a.lift).slice(0, 10);
    lines.push('**Biggest improvements:**');
    lines.push('');
    lines.push('| Skill | Without | With | Improvement |');
    lines.push('|-------|---------|------|-------------|');
    for (const r of top10) {
      lines.push(`| ${r.skill} | ${r.baseline_avg}% | ${r.with_context_avg}% | **+${r.lift}%** |`);
    }
    lines.push('');
  }

  // Top 10
  lines.push('## Top 10 Starter Skills');
  lines.push('');
  lines.push('New to this? Start here. These are the most commonly needed skills for any e-commerce project.');
  lines.push('');
  const starterIds = [
    'checkout-flow-optimization', 'product-data-modeling', 'stripe-integration',
    'ecommerce-seo', 'cart-logic', 'inventory-tracking',
    'shipping-rate-calculator', 'customer-accounts', 'discount-engine',
    'product-page-design'
  ];
  lines.push('| Skill | What It Does | Eval Score |');
  lines.push('|-------|-------------|------------|');
  for (const id of starterIds) {
    const skill = catalog.skills.find(s => s.id === id);
    if (skill) {
      const ev = evalBySkill[id];
      const score = ev && ev.with_context_avg != null ? `${ev.with_context_avg}%` : '—';
      lines.push(`| **${toTitleCase(skill.id)}** | ${skill.description} | ${score} |`);
    }
  }
  lines.push('');

  // Categories
  lines.push('## All Categories');
  lines.push('');
  lines.push(`${catalog.total} skills organized into ${categoryCount} categories. Click any category to browse its skills.`);
  lines.push('');
  lines.push('| Category | Skills | Examples |');
  lines.push('|----------|--------|----------|');
  for (const [category, skills] of Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b))) {
    const examples = skills.map(s => toTitleCase(s.id)).slice(0, 3).join(', ');
    const more = skills.length > 3 ? `, +${skills.length - 3} more` : '';
    lines.push(`| [**${toTitleCase(category)}**](skills/${category}/) | ${skills.length} | ${examples}${more} |`);
  }
  lines.push('');

  // Bundles
  lines.push('## Curated Bundles');
  lines.push('');
  lines.push('Don\'t know where to start? Pick a bundle based on your role. Each bundle is a recommended set of skills for a specific job.');
  lines.push('');
  const bundleDescriptions = {
    'common': 'Essential skills every e-commerce project needs',
    'store-builder': 'Everything to build a full online store from scratch',
    'growth-marketer': 'SEO, email, social, analytics, and conversion optimization',
    'platform-migrator': 'Tools for migrating between e-commerce platforms',
    'security-ops': 'PCI compliance, fraud detection, GDPR, and security hardening',
    'headless-architect': 'Build modern headless/composable commerce architectures',
    'b2b-specialist': 'B2B features — bulk pricing, company accounts, ERP integration',
    'marketplace-builder': 'Multi-vendor marketplace with seller management and payouts',
  };

  const bundlesPath = resolve(process.cwd(), 'data/bundles.json');
  if (existsSync(bundlesPath)) {
    const bundles = JSON.parse(readFileSync(bundlesPath, 'utf-8'));
    lines.push('| Bundle | What It\'s For | Skills |');
    lines.push('|--------|--------------|--------|');
    for (const [name, skills] of Object.entries(bundles)) {
      const desc = bundleDescriptions[name] || toTitleCase(name);
      lines.push(`| **${toTitleCase(name)}** | ${desc} | ${skills.length} skills |`);
    }
    lines.push('');
  }
  lines.push('See [bundles.json](data/bundles.json) for the full skill lists in each bundle.');
  lines.push('');

  // Browse All
  lines.push('## Browse All Skills');
  lines.push('');
  lines.push(`See [CATALOG.md](CATALOG.md) for the complete list of all ${catalog.total} skills with descriptions, tags, and evaluation scores.`);
  lines.push('');

  // Contributing
  lines.push('## Contributing');
  lines.push('');
  lines.push('We welcome contributions! Whether you want to improve an existing skill or add a new one:');
  lines.push('');
  lines.push('1. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines');
  lines.push('2. Check out the [skill template](docs/contributors/skill-template.md) to get started');
  lines.push('3. Run `npm run validate` to check your skill before submitting');
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

  // Load eval results if available
  const evalPath = resolve(process.cwd(), 'data/eval-results.json');
  const evalResults = existsSync(evalPath)
    ? JSON.parse(readFileSync(evalPath, 'utf-8'))
    : null;

  const readme = generateReadme(catalog, evalResults);
  writeFileSync(resolve(process.cwd(), 'README.md'), readme);
  console.log('Generated README.md');
}
