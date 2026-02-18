#!/usr/bin/env node
'use strict';

const path = require('path');
const { fmt } = require('../src/format');

const VERSION = require('../package.json').version;

// ── Parse args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const command = args.find(a => !a.startsWith('-'));
const flags = {};
const positional = [];

const SHORT_VALUE_FLAGS = new Set(['f', 's']);

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === command && positional.length === 0 && !arg.startsWith('-')) {
    continue; // skip the command itself
  } else if (arg.startsWith('--')) {
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      flags[arg.slice(2)] = true;
    }
  } else if (arg.startsWith('-') && arg.length === 2) {
    const flag = arg.slice(1);
    if (SHORT_VALUE_FLAGS.has(flag) && i + 1 < args.length) {
      flags[flag] = args[++i];
    } else {
      flags[flag] = true;
    }
  } else {
    positional.push(arg);
  }
}

// ── Help text ───────────────────────────────────────────────────────
const HELP = `
${fmt.key('env-doctor')} v${VERSION} — Diagnose, validate, and manage .env files

${fmt.key('Usage:')}
  env-doctor check  [dir]            Validate .env against .env.schema or .env.example
  env-doctor diff   <file1> <file2>  Compare two env files side by side
  env-doctor mask   [dir]            Print .env with sensitive values masked
  env-doctor init   [dir]            Generate .env.example from an existing .env
  env-doctor sync   [dir]            Sync .env with schema/example (add missing vars)

${fmt.key('Options:')}
  --strict           Exit with error on warnings too
  --env=<file>       Specify env file name (default: .env)
  --example=<file>   Specify example file name (default: .env.example)
  --values           Show values in diff output
  --mask-all         Mask all values, not just sensitive ones
  --strip-values     Strip all values in init output
  --output=<file>    Write output to file (mask, init)
  --force            Overwrite existing files
  --dry-run          Preview without writing
  --no-heuristics    Skip heuristic checks in check command
  --non-interactive  Skip prompts in sync (use defaults or leave empty)
  -f, --file=<file>  Target env file for sync (default: .env)
  -s, --schema=<f>   Schema file for sync (default: .env.schema)
  -h, --help         Show help
  -v, --version      Show version
`;

// ── Route command ───────────────────────────────────────────────────
if (!command || command === 'help' || flags.h || flags.help) {
  console.log(HELP);
  process.exit(0);
}

if (flags.v || flags.version) {
  console.log(VERSION);
  process.exit(0);
}

const COMMANDS = {
  check: '../src/commands/check',
  diff: '../src/commands/diff',
  mask: '../src/commands/mask',
  init: '../src/commands/init',
  sync: '../src/commands/sync',
};

if (!COMMANDS[command]) {
  fmt.die(`Unknown command: "${command}". Run env-doctor --help for usage.`);
}

const dir = command === 'diff'
  ? process.cwd()
  : path.resolve(positional[0] || '.');

try {
  const result = require(COMMANDS[command]).run(dir, flags, positional);
  if (result && typeof result.then === 'function') {
    result.catch(err => {
      if (process.env.DEBUG) console.error(err);
      fmt.die(err.message);
    });
  }
} catch (err) {
  if (process.env.DEBUG) console.error(err);
  fmt.die(err.message);
}
