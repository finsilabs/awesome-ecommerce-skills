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
