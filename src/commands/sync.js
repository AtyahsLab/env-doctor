'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { parseEnvFile, parseSchemaFile } = require('../parser');
const { fmt } = require('../format');

/**
 * Build the synced .env content.
 * Returns { content, added, orphaned, defaults, prompted }
 */
function buildSync(envData, schemaData, exampleData, answers) {
  const isSchema = !!schemaData;
  const reference = isSchema ? schemaData : (exampleData ? exampleData.vars : {});
  const referenceKeys = isSchema
    ? Object.keys(schemaData)
    : (exampleData ? exampleData.order : []);

  const envVars = envData ? envData.vars : {};
  const envOrder = envData ? envData.order : [];

  const added = [];
  const orphaned = [];
  const defaults = [];
  const prompted = [];

  // Find orphaned keys (in .env but not in schema/example)
  for (const key of envOrder) {
    if (isSchema) {
      if (!(key in schemaData)) orphaned.push(key);
    } else {
      if (!(key in reference)) orphaned.push(key);
    }
  }

  // Find missing keys
  const missing = referenceKeys.filter(k => !(k in envVars));

  // Build lines: preserve existing .env content, then append missing
  const lines = [];

  // Copy existing .env file content (raw) if it exists
  if (envData && envData._raw) {
    // Preserve existing file as-is
    const rawLines = envData._raw.split('\n');
    // Remove trailing empty line if present
    if (rawLines.length && rawLines[rawLines.length - 1] === '') {
      rawLines.pop();
    }
    lines.push(...rawLines);
  }

  // Append missing variables
  if (missing.length) {
    if (lines.length > 0) {
      lines.push('');
      lines.push('# Added by env-doctor sync');
    }

    for (const key of missing) {
      let value = '';
      let source = '';

      if (isSchema && schemaData[key].default !== undefined) {
        value = schemaData[key].default;
        source = 'default';
        defaults.push(key);
      } else if (!isSchema && exampleData.vars[key] && exampleData.vars[key].value) {
        value = exampleData.vars[key].value;
        source = 'example';
        defaults.push(key);
      } else if (answers && key in answers) {
        value = answers[key];
        source = 'prompted';
        prompted.push(key);
      }

      added.push({ key, value, source });
      lines.push(`${key}=${value}`);
    }
  }

  // Ensure trailing newline
  const content = lines.join('\n') + '\n';

  return { content, added, orphaned, defaults, prompted, missing };
}

/**
 * Prompt user for missing values interactively.
 */
async function promptForValues(missing, schemaData) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,  // prompts to stderr so stdout stays clean
  });

  const answers = {};

  for (const key of missing) {
    const rule = schemaData ? schemaData[key] : null;
    let prompt = `  Enter value for ${key}`;
    if (rule && rule.type && rule.type !== 'string') prompt += ` (${rule.type})`;
    if (rule && rule.enum) prompt += ` [${rule.enum.join('|')}]`;
    prompt += ': ';

    const answer = await new Promise(resolve => {
      rl.question(prompt, resolve);
    });
    answers[key] = answer;
  }

  rl.close();
  return answers;
}

async function run(dir, flags) {
  // Resolve schema file
  const schemaFileName = flags.s || flags.schema;
  let schemaPath, examplePath;

  if (schemaFileName) {
    schemaPath = path.join(dir, schemaFileName);
  } else {
    schemaPath = path.join(dir, '.env.schema');
    examplePath = path.join(dir, '.env.example');
  }

  const schema = parseSchemaFile(schemaPath);
  const example = !schema && examplePath ? parseEnvFile(examplePath) : null;

  // If a specific schema file was given but not found
  if (schemaFileName && !schema) {
    return fmt.die(`Schema file not found: ${schemaFileName}`);
  }

  if (!schema && !example) {
    return fmt.die('No .env.schema or .env.example found. Create one first.');
  }

  // Resolve env file
  const envFileName = flags.f || flags.file || '.env';
  const envPath = path.join(dir, envFileName);
  let envData = parseEnvFile(envPath);

  // Attach raw content for preservation
  if (envData && fs.existsSync(envPath)) {
    envData._raw = fs.readFileSync(envPath, 'utf8');
  }

  const isSchema = !!schema;
  const reference = isSchema ? schema : example.vars;
  const referenceKeys = isSchema ? Object.keys(schema) : example.order;

  // Determine missing keys that need values
  const envVars = envData ? envData.vars : {};
  const missing = referenceKeys.filter(k => !(k in envVars));

  // Figure out which missing keys have no default and need prompting
  const needsPrompt = missing.filter(k => {
    if (isSchema && schema[k].default !== undefined) return false;
    if (!isSchema && example.vars[k] && example.vars[k].value) return false;
    return true;
  });

  let answers = {};
  const nonInteractive = flags['non-interactive'];

  if (needsPrompt.length > 0 && !nonInteractive && !flags['dry-run'] && process.stdin.isTTY) {
    answers = await promptForValues(needsPrompt, schema);
  }

  const result = buildSync(envData, schema, example, answers);

  // Print report
  const source = isSchema ? '.env.schema' : '.env.example';
  console.log(fmt.heading(`Syncing ${envFileName} with ${source}`));

  if (result.orphaned.length) {
    console.log(fmt.warn(`  ⚠ Orphaned variables (not in ${source}):`));
    for (const k of result.orphaned) {
      console.log(`    ${fmt.warn('!')} ${k}`);
    }
    console.log();
  }

  if (result.added.length) {
    console.log(`  Variables to add:`);
    for (const { key, value, source: src } of result.added) {
      const label = src === 'default' ? fmt.dim('(default)')
        : src === 'example' ? fmt.dim('(from example)')
        : src === 'prompted' ? fmt.dim('(user input)')
        : fmt.dim('(empty)');
      const display = value ? `=${value}` : '=';
      console.log(`    ${fmt.success('+')} ${fmt.key(key)}${display} ${label}`);
    }
    console.log();
  }

  if (!result.added.length && !result.orphaned.length) {
    console.log(fmt.success('  ✓ Already in sync!'));
    console.log();
    return;
  }

  if (flags['dry-run']) {
    console.log(fmt.dim('  Dry run — no files were written.'));
    console.log();
    return;
  }

  if (result.added.length) {
    fs.writeFileSync(envPath, result.content);
    console.log(fmt.success(`  ✓ Written ${envFileName} (${result.added.length} variable(s) added)`));
    console.log();
  }
}

module.exports = { run, buildSync };
