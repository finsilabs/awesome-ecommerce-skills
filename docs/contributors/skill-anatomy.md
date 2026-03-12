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
