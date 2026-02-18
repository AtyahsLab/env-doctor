'use strict';

const fs = require('fs');
const path = require('path');
const { parseEnvFile, parseSchemaFile } = require('../parser');
const { fmt } = require('../format');

/**
 * Build the fixed .env content based on schema.
 * Returns { content, added, removed, reordered, original }
 */
function buildFix(envData, schema, flags) {
  const envVars = envData ? { ...envData.vars } : {};
  const envOrder = envData ? [...envData.order] : [];
  const schemaKeys = Object.keys(schema);

  const added = [];
  const removed = [];
  let reordered = false;

  // Track which env keys are in schema
  const inSchema = new Set(schemaKeys);
  const orphanKeys = envOrder.filter(k => !inSchema.has(k));

  // 1. Determine keys to add (in schema but not in env)
  const missing = schemaKeys.filter(k => !(k in envVars));
  for (const key of missing) {
    const rule = schema[key];
    const defaultVal = rule.default !== undefined ? rule.default : '';
    added.push({ key, value: defaultVal, hasDefault: rule.default !== undefined });
  }

  // 2. Handle orphans
  if (flags['remove-orphans'] && orphanKeys.length) {
    for (const key of orphanKeys) {
      removed.push({ key, value: envVars[key].value });
    }
  }

  // 3. Build output lines
  let outputKeys;
  if (flags.sort) {
    // Schema order for schema keys, then orphans (if kept)
    const kept = schemaKeys.filter(k => k in envVars || missing.includes(k));
    const keptOrphans = flags['remove-orphans'] ? [] : orphanKeys;
    outputKeys = [...kept, ...keptOrphans];
    // Check if order changed
    const currentOrder = envOrder.filter(k => !flags['remove-orphans'] || inSchema.has(k));
    const newOrder = outputKeys.filter(k => k in envVars);
    if (JSON.stringify(currentOrder) !== JSON.stringify(newOrder)) {
      reordered = true;
    }
  } else {
    // Preserve existing order, append missing at end
    const kept = flags['remove-orphans']
      ? envOrder.filter(k => inSchema.has(k))
      : [...envOrder];
    const newKeys = missing;
    outputKeys = [...kept, ...newKeys];
  }

  // Build the actual content
  const lines = [];
  const removedSet = new Set(removed.map(r => r.key));

  // Gather comments from original env data
  const envComments = envData ? envData.vars : {};

  for (const key of outputKeys) {
    if (removedSet.has(key)) continue;

    if (key in envVars) {
      // Existing variable — preserve value
      const entry = envVars[key];
      if (entry.comment) {
        lines.push(`# ${entry.comment}`);
      }
      lines.push(`${key}=${entry.value}`);
    } else if (key in schema) {
      // New variable from schema
      const rule = schema[key];
      const val = rule.default !== undefined ? rule.default : '';
      if (val === '') {
        lines.push(`# TODO: Set value for ${key}`);
      }
      lines.push(`${key}=${val}`);
    }
  }

  // Handle commented-out orphans (when remove-orphans but we comment instead of delete)
  // Actually per spec: "Removes or comments out" — let's comment them out
  if (flags['remove-orphans'] && orphanKeys.length) {
    if (lines.length > 0) lines.push('');
    lines.push('# Orphaned variables (commented out by env-doctor fix)');
    for (const key of orphanKeys) {
      lines.push(`# ${key}=${envVars[key].value}`);
    }
  }

  const content = lines.join('\n') + '\n';
  const original = envData
    ? envOrder.map(k => `${k}=${envVars[k].value}`).join('\n') + '\n'
    : '';

  return { content, added, removed, reordered, original, orphanKeys };
}

/**
 * Generate a simple colored diff between two strings.
 */
function colorDiff(oldStr, newStr) {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const output = [];

  // Simple line-by-line diff using LCS-like approach
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  // Track which lines are only in old or new
  const allLines = [];

  let oi = 0, ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      allLines.push({ type: ' ', text: oldLines[oi] });
      oi++; ni++;
    } else if (ni < newLines.length && (oi >= oldLines.length || !oldSet.has(newLines[ni]))) {
      allLines.push({ type: '+', text: newLines[ni] });
      ni++;
    } else if (oi < oldLines.length && (ni >= newLines.length || !newSet.has(oldLines[oi]))) {
      allLines.push({ type: '-', text: oldLines[oi] });
      oi++;
    } else {
      // Both exist but differ — show as removal + addition
      allLines.push({ type: '-', text: oldLines[oi] });
      allLines.push({ type: '+', text: newLines[ni] });
      oi++; ni++;
    }
  }

  for (const line of allLines) {
    if (line.type === '+') output.push(fmt.success(`+ ${line.text}`));
    else if (line.type === '-') output.push(fmt.error(`- ${line.text}`));
    // Skip context lines for brevity
  }

  return output.join('\n');
}

function run(dir, flags) {
  const envFileName = flags.env || '.env';
  const envPath = path.join(dir, envFileName);

  // Schema is required for fix
  const schemaPath = path.join(dir, flags.schema || '.env.schema');
  const schema = parseSchemaFile(schemaPath);
  if (!schema) {
    return fmt.die(`Schema file not found: ${schemaPath}\nThe fix command requires a .env.schema file.`);
  }

  const envData = parseEnvFile(envPath);

  const result = buildFix(envData, schema, flags);

  // Check if anything changed
  const hasChanges = result.added.length > 0 || result.removed.length > 0 || result.reordered;

  if (!hasChanges && result.original === result.content) {
    console.log(fmt.success('\n✓ Nothing to fix — .env is already in sync with schema!\n'));
    return;
  }

  // Print summary
  console.log(fmt.heading('env-doctor fix'));

  if (result.added.length) {
    console.log(`  ${fmt.success('Added')} ${result.added.length} missing variable(s):`);
    for (const { key, value, hasDefault } of result.added) {
      const label = hasDefault ? fmt.dim(`(default: ${value})`) : fmt.dim('(empty)');
      console.log(`    ${fmt.success('+')} ${fmt.key(key)} ${label}`);
    }
    console.log();
  }

  if (result.removed.length) {
    console.log(`  ${fmt.warn('Commented out')} ${result.removed.length} orphaned variable(s):`);
    for (const { key } of result.removed) {
      console.log(`    ${fmt.warn('-')} ${key}`);
    }
    console.log();
  }

  if (result.reordered) {
    console.log(`  ${fmt.dim('↕ Reordered variables to match schema order')}`);
    console.log();
  }

  // Show diff
  if (result.original) {
    const diff = colorDiff(result.original, result.content);
    if (diff) {
      console.log(fmt.heading('Changes'));
      console.log(diff);
      console.log();
    }
  }

  if (flags['dry-run']) {
    console.log(fmt.dim('  Dry run — no files were written.\n'));
    return;
  }

  fs.writeFileSync(envPath, result.content);
  console.log(fmt.success(`  ✓ Written ${envFileName}\n`));
}

module.exports = { run, buildFix };