# Awesome E-Commerce Skills

> 1 curated e-commerce skills for AI coding assistants and commerce practitioners.

![Skills](https://img.shields.io/badge/skills-1-blue) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![Tessl Evaluated](https://img.shields.io/badge/Tessl-evaluated-purple)

**Compatible with:** Claude Code | Cursor | Gemini CLI | Copilot | Codex CLI | Kiro | OpenCode

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [What's Inside](#whats-inside)
- [Project Structure](#project-structure)
- [Top 10 Starter Skills](#top-10-starter-skills)
- [Curated Bundles](#curated-bundles)
- [Workflows](#workflows)
- [Categories](#categories)
- [Browse All Skills](#browse-all-skills)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

1. Clone this repo
2. Copy skills you need into your project's context
3. Invoke with `@skill-name` in your AI assistant

## Installation

**Via Tessl (recommended):**

```sh
# Install the Tessl CLI
curl -fsSL https://get.tessl.io | sh

# Install individual skills
tessl install awesome-ecommerce/stripe-integration
tessl install awesome-ecommerce/checkout-flow-optimization
```

**Manual:**

```sh
git clone https://github.com/YOUR_USERNAME/awesome-ecommerce-skills.git
cp -r awesome-ecommerce-skills/skills/payments-checkout/stripe-integration .claude/skills/
```

## What's Inside

- **1 skills** across 1 categories
- Every skill evaluated with [Tessl](https://tessl.io) task evals (baseline vs with-skill comparison)
- Role-based bundles for quick onboarding
- Multi-step workflows for common e-commerce journeys
- Validation tooling and CI pipeline

## Top 10 Starter Skills

| Skill | Category | Description |
|-------|----------|-------------|
| `@stripe-integration` | payments-checkout | Stripe payment intents, subscriptions, webhooks, and SCA compliance |

## Categories

| Category | Skills | Description |
|----------|--------|-------------|
| **Payments Checkout** `payments-checkout` | 1 | `@stripe-integration` |

## Browse All Skills

See [CATALOG.md](CATALOG.md) for the full list of 1 skills with descriptions, tags, and eval scores.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```sh
# Validate your skill locally
npm run validate
```

## License

MIT
