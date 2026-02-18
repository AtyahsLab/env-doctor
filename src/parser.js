'use strict';

const fs = require('fs');

/**
 * Parse a .env file into a structured representation.
 * Returns { vars: { KEY: { value, line, comment } }, order: [keys], comments: [string] }
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  return parseEnvString(content);
}

/**
 * Parse a .env string into structured data.
 */
function parseEnvString(content) {
  const vars = {};
  const order = [];
  const lines = content.split('\n');
  let pendingComment = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      pendingComment = null;
      continue;
    }

    if (trimmed.startsWith('#')) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    // Handle inline comments (only for unquoted values)
    let inlineComment = null;
    if (!value.startsWith('"') && !value.startsWith("'")) {
      const hashIdx = value.indexOf(' #');
      if (hashIdx !== -1) {
        inlineComment = value.slice(hashIdx + 2).trim();
        value = value.slice(0, hashIdx).trim();
      }
    }

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    vars[key] = {
      value,
      line: i + 1,
      comment: pendingComment || inlineComment || null,
    };
    order.push(key);
    pendingComment = null;
  }

  return { vars, order };
}

/**
 * Parse a .env.schema file (JSON or env-like DSL).
 *
 * Schema format (env-like DSL):
 *   # Comments are allowed
 *   DATABASE_URL=required,url
 *   PORT=required,number,default:3000
 *   DEBUG=boolean,default:false
 *   API_KEY=required,secret,min:16
 *   APP_NAME=string,pattern:^[a-z-]+$
 *
 * Supported rule tokens:
 *   required          — variable must be present and non-empty
 *   optional          — variable may be absent (default)
 *   string|number|boolean|url|email|ip — type checks
 *   secret            — marks as sensitive (mask commands)
 *   default:<value>   — default value
 *   min:<n>           — minimum length
 *   max:<n>           — maximum length
 *   pattern:<regex>   — regex pattern the value must match
 *   enum:<a|b|c>      — value must be one of the listed options
 */
function parseSchemaFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');

  // Try JSON first
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    try {
      return normalizeJsonSchema(JSON.parse(trimmed));
    } catch {
      // Fall through to DSL parsing
    }
  }

  return parseSchemaDSL(content);
}

function normalizeJsonSchema(json) {
  const schema = {};
  for (const [key, def] of Object.entries(json)) {
    if (typeof def === 'string') {
      schema[key] = parseRuleTokens(def.split(',').map(s => s.trim()));
    } else if (typeof def === 'object') {
      schema[key] = { required: false, type: 'string', ...def };
    }
  }
  return schema;
}

function parseSchemaDSL(content) {
  const schema = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const rules = trimmed.slice(eqIdx + 1).trim();

    if (!rules) {
      schema[key] = { required: false, type: 'string' };
      continue;
    }

    schema[key] = parseRuleTokens(rules.split(',').map(s => s.trim()));
  }
  return schema;
}

function parseRuleTokens(tokens) {
  const rule = { required: false, type: 'string' };

  const types = new Set(['string', 'number', 'boolean', 'url', 'email', 'ip']);

  for (const token of tokens) {
    if (token === 'required') {
      rule.required = true;
    } else if (token === 'optional') {
      rule.required = false;
    } else if (token === 'secret') {
      rule.secret = true;
    } else if (types.has(token)) {
      rule.type = token;
    } else if (token.startsWith('default:')) {
      rule.default = token.slice(8);
    } else if (token.startsWith('min:')) {
      rule.min = parseInt(token.slice(4), 10);
    } else if (token.startsWith('max:')) {
      rule.max = parseInt(token.slice(4), 10);
    } else if (token.startsWith('pattern:')) {
      rule.pattern = token.slice(8);
    } else if (token.startsWith('enum:')) {
      rule.enum = token.slice(5).split('|').map(s => s.trim());
    }
  }

  return rule;
}

module.exports = { parseEnvFile, parseEnvString, parseSchemaFile, parseSchemaDSL, parseRuleTokens };
