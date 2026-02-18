'use strict';

const fs = require('fs');
const path = require('path');
const { parseEnvFile } = require('../parser');
const { inferType } = require('../validator');
const { fmt } = require('../format');

function run(dir, flags) {
  const envPath = path.join(dir, flags.env || '.env');
  const env = parseEnvFile(envPath);
  if (!env) return fmt.die(`File not found: ${envPath}`);

  const outputFile = flags.output || '.env.example';
  const outputPath = path.join(dir, outputFile);

  const sensitivePattern = /(?:password|secret|key|token|api_key|apikey|auth|credential|private)/i;

  const lines = [];

  // Read original file to preserve comments and structure
  const original = fs.readFileSync(envPath, 'utf8');
  for (const line of original.split('\n')) {
    const trimmed = line.trim();

    // Preserve blank lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      lines.push(line);
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      lines.push(line);
      continue;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const entry = env.vars[key];
    if (!entry) {
      lines.push(line);
      continue;
    }

    const isSensitive = sensitivePattern.test(key);

    if (isSensitive) {
      lines.push(`${key}=`);
    } else if (flags['strip-values']) {
      lines.push(`${key}=`);
    } else {
      // Keep non-sensitive values as examples
      lines.push(`${key}=${entry.value}`);
    }
  }

  const result = lines.join('\n');

  if (flags['dry-run']) {
    process.stdout.write(result);
    if (!result.endsWith('\n')) process.stdout.write('\n');
  } else {
    if (fs.existsSync(outputPath) && !flags.force) {
      return fmt.die(`${outputFile} already exists. Use --force to overwrite.`);
    }
    fs.writeFileSync(outputPath, result);
    console.log(fmt.success(`✓ Generated ${outputFile} (${env.order.length} variables)`));
  }
}

module.exports = { run };
