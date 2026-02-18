'use strict';

const path = require('path');
const { parseEnvFile, parseSchemaFile } = require('../parser');
const { validateAgainstSchema, detectIssues } = require('../validator');
const { fmt } = require('../format');

function run(dir, flags) {
  const envPath = path.join(dir, flags.env || '.env');
  const env = parseEnvFile(envPath);
  if (!env) return fmt.die(`File not found: ${envPath}`);

  // Determine what to check against: .env.schema > .env.example
  const schemaPath = path.join(dir, '.env.schema');
  const examplePath = path.join(dir, flags.example || '.env.example');

  const schema = parseSchemaFile(schemaPath);
  const example = parseEnvFile(examplePath);

  if (!schema && !example) {
    return fmt.die('No .env.schema or .env.example found. Create one to validate against.');
  }

  const output = { errors: 0, warnings: 0 };

  if (schema) {
    runSchemaCheck(env, schema, output, flags);
  } else {
    runExampleCheck(env, example, output, flags);
  }

  // Heuristic checks on all vars
  if (!flags['no-heuristics']) {
    let heuristicIssues = [];
    for (const [key, entry] of Object.entries(env.vars)) {
      for (const issue of detectIssues(key, entry.value)) {
        heuristicIssues.push({ key, ...issue });
      }
    }
    if (heuristicIssues.length) {
      console.log(fmt.heading('Heuristic Warnings'));
      for (const issue of heuristicIssues) {
        const icon = issue.level === 'error' ? fmt.error('✗') : fmt.warn('!');
        console.log(`  ${icon} ${fmt.key(issue.key)}: ${issue.message}`);
        if (issue.level === 'error') output.errors++;
        else output.warnings++;
      }
      console.log();
    }
  }

  // Summary
  printSummary(output);

  if (output.errors > 0) process.exit(1);
  if (flags.strict && output.warnings > 0) process.exit(1);
}

function runSchemaCheck(env, schema, output, _flags) {
  console.log(fmt.heading('Checking .env against .env.schema'));

  const issues = validateAgainstSchema(env.vars, schema);

  // Also check for keys in schema not in env (that aren't already flagged as required)
  const missingOptional = [];
  for (const key of Object.keys(schema)) {
    if (!(key in env.vars) && !schema[key].required) {
      missingOptional.push(key);
    }
  }

  // Extra keys
  const extraKeys = env.order.filter(k => !(k in schema));

  if (issues.length) {
    for (const issue of issues) {
      const icon = issue.level === 'error' ? fmt.error('✗') : fmt.warn('!');
      console.log(`  ${icon} ${fmt.key(issue.key)}: ${issue.message}`);
      if (issue.level === 'error') output.errors++;
      else output.warnings++;
    }
    console.log();
  }

  if (missingOptional.length) {
    console.log(fmt.dim(`  ℹ ${missingOptional.length} optional variable(s) not set: ${missingOptional.join(', ')}`));
    console.log();
  }

  if (extraKeys.length) {
    console.log(fmt.warn(`  ⚠ ${extraKeys.length} variable(s) not in schema: ${extraKeys.join(', ')}`));
    output.warnings += extraKeys.length;
    console.log();
  }
}

function runExampleCheck(env, example, output, _flags) {
  console.log(fmt.heading('Checking .env against .env.example'));

  const missing = example.order.filter(k => !(k in env.vars));
  const extra = env.order.filter(k => !(k in example.vars));

  if (missing.length) {
    console.log(fmt.error('  Missing variables:'));
    for (const k of missing) {
      console.log(`    ${fmt.error('✗')} ${fmt.key(k)}`);
    }
    output.errors += missing.length;
    console.log();
  }

  if (extra.length) {
    console.log(fmt.warn('  Extra variables (not in .env.example):'));
    for (const k of extra) {
      console.log(`    ${fmt.warn('!')} ${k}`);
    }
    output.warnings += extra.length;
    console.log();
  }

  if (!missing.length && !extra.length) {
    console.log(fmt.success('  ✓ All variables accounted for!'));
    console.log();
  }

  const total = example.order.length;
  const present = total - missing.length;
  console.log(fmt.dim(`  Coverage: ${present}/${total} (${total ? Math.round(present / total * 100) : 100}%)`));
  console.log();
}

function printSummary(output) {
  if (output.errors === 0 && output.warnings === 0) {
    console.log(fmt.success('✓ All checks passed!'));
  } else {
    const parts = [];
    if (output.errors) parts.push(fmt.error(`${output.errors} error(s)`));
    if (output.warnings) parts.push(fmt.warn(`${output.warnings} warning(s)`));
    console.log(`Result: ${parts.join(', ')}`);
  }
}

module.exports = { run };
