'use strict';

const fs = require('fs');
const path = require('path');
const { parseSchemaFile } = require('../parser');
const { fmt } = require('../format');

function run(dir, flags) {
  const envPath = path.join(dir, flags.env || '.env');

  if (!fs.existsSync(envPath)) return fmt.die(`File not found: ${envPath}`);

  const content = fs.readFileSync(envPath, 'utf8');
  const schemaPath = path.join(dir, '.env.schema');
  const schema = parseSchemaFile(schemaPath);

  // Determine which keys are sensitive
  const sensitivePattern = /(?:password|secret|key|token|api_key|apikey|auth|credential|private)/i;

  const lines = content.split('\n');
  const output = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Pass through comments and blank lines
    if (!trimmed || trimmed.startsWith('#')) {
      output.push(line);
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      output.push(line);
      continue;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    const isSensitive = flags['mask-all'] ||
      sensitivePattern.test(key) ||
      (schema && schema[key]?.secret);

    if (isSensitive && value) {
      // Preserve quotes if present
      let masked;
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        const inner = value.slice(1, -1);
        masked = inner.length <= 3 ? '***' : inner.slice(0, 3) + '*'.repeat(Math.max(inner.length - 3, 5));
        masked = value[0] + masked + value[value.length - 1];
      } else {
        masked = value.length <= 3 ? '***' : value.slice(0, 3) + '*'.repeat(Math.max(value.length - 3, 5));
      }
      output.push(`${key}=${masked}`);
    } else {
      output.push(line);
    }
  }

  const result = output.join('\n');

  if (flags.output) {
    fs.writeFileSync(flags.output, result);
    console.log(fmt.success(`✓ Masked output written to ${flags.output}`));
  } else {
    process.stdout.write(result);
    // Ensure trailing newline
    if (!result.endsWith('\n')) process.stdout.write('\n');
  }
}

module.exports = { run };
