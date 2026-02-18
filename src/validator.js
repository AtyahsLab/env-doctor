'use strict';

/**
 * Validate a set of env vars against a schema.
 * Returns an array of { key, level, message } objects.
 */
function validateAgainstSchema(vars, schema) {
  const issues = [];

  // Check every schema key
  for (const [key, rule] of Object.entries(schema)) {
    const entry = vars[key];
    const value = entry?.value;
    const exists = entry !== undefined;

    if (rule.required && (!exists || value === '')) {
      issues.push({ key, level: 'error', message: 'Required variable is missing or empty' });
      continue;
    }

    if (!exists) continue;

    if (value === '' && !rule.required) continue;

    // Type validation
    if (rule.type && value !== '') {
      const typeIssue = validateType(value, rule.type);
      if (typeIssue) {
        issues.push({ key, level: 'error', message: typeIssue });
      }
    }

    // Min length
    if (rule.min !== undefined && value.length < rule.min) {
      issues.push({ key, level: 'error', message: `Value too short (${value.length} < ${rule.min})` });
    }

    // Max length
    if (rule.max !== undefined && value.length > rule.max) {
      issues.push({ key, level: 'error', message: `Value too long (${value.length} > ${rule.max})` });
    }

    // Pattern
    if (rule.pattern) {
      try {
        if (!new RegExp(rule.pattern).test(value)) {
          issues.push({ key, level: 'error', message: `Value doesn't match pattern: ${rule.pattern}` });
        }
      } catch {
        issues.push({ key, level: 'warn', message: `Invalid regex pattern in schema: ${rule.pattern}` });
      }
    }

    // Enum
    if (rule.enum && !rule.enum.includes(value)) {
      issues.push({ key, level: 'error', message: `Value must be one of: ${rule.enum.join(', ')}` });
    }
  }

  return issues;
}

function validateType(value, type) {
  switch (type) {
    case 'number':
      if (isNaN(Number(value)) || value.trim() === '') return `Expected a number, got: "${value}"`;
      break;
    case 'boolean':
      if (!['true', 'false', '0', '1', 'yes', 'no'].includes(value.toLowerCase()))
        return `Expected a boolean, got: "${value}"`;
      break;
    case 'url':
      if (!/^https?:\/\/.+/.test(value)) return `Expected a URL, got: "${value}"`;
      break;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `Expected an email, got: "${value}"`;
      break;
    case 'ip':
      if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return `Expected an IP address, got: "${value}"`;
      break;
    case 'string':
      break;
  }
  return null;
}

/**
 * Detect common issues heuristically (no schema needed).
 */
function detectIssues(key, value) {
  const issues = [];

  if (value === '') {
    issues.push({ level: 'warn', message: 'Empty value' });
  }

  const secretPattern = /(?:password|secret|key|token|api_key|apikey|auth|credential)/i;
  if (secretPattern.test(key) && value) {
    if (['changeme', 'password', '123456', 'secret', 'test', 'example'].includes(value.toLowerCase())) {
      issues.push({ level: 'error', message: 'Insecure default value for sensitive variable' });
    }
  }

  if (/port/i.test(key) && value) {
    const port = parseInt(value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      issues.push({ level: 'error', message: 'Invalid port number' });
    }
  }

  return issues;
}

/**
 * Infer the likely type of a value.
 */
function inferType(value) {
  if (value === '') return 'string';
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^\d+$/.test(value)) return 'number';
  if (/^\d+\.\d+$/.test(value)) return 'number';
  if (/^https?:\/\//.test(value)) return 'url';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  return 'string';
}

module.exports = { validateAgainstSchema, detectIssues, inferType };
