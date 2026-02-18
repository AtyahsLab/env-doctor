'use strict';

const path = require('path');
const { parseEnvFile } = require('../parser');
const { fmt } = require('../format');

function run(_dir, flags, positional) {
  const file1 = positional[0];
  const file2 = positional[1];

  if (!file1 || !file2) {
    return fmt.die('Usage: env-doctor diff <file1> <file2>');
  }

  const env1 = parseEnvFile(path.resolve(file1));
  const env2 = parseEnvFile(path.resolve(file2));

  if (!env1) return fmt.die(`File not found: ${file1}`);
  if (!env2) return fmt.die(`File not found: ${file2}`);

  const name1 = path.basename(file1);
  const name2 = path.basename(file2);

  console.log(fmt.heading(`Comparing ${name1} ↔ ${name2}`));

  const allKeys = [...new Set([...Object.keys(env1.vars), ...Object.keys(env2.vars)])].sort();

  const added = [];
  const removed = [];
  const changed = [];
  const same = [];

  for (const key of allKeys) {
    const in1 = key in env1.vars;
    const in2 = key in env2.vars;

    if (!in1) {
      added.push(key);
    } else if (!in2) {
      removed.push(key);
    } else if (env1.vars[key].value !== env2.vars[key].value) {
      changed.push(key);
    } else {
      same.push(key);
    }
  }

  if (removed.length) {
    for (const k of removed) {
      console.log(`  ${fmt.error('-')} ${k}  ${fmt.dim(`(only in ${name1})`)}`);
    }
  }
  if (added.length) {
    for (const k of added) {
      console.log(`  ${fmt.success('+')} ${k}  ${fmt.dim(`(only in ${name2})`)}`);
    }
  }
  if (changed.length) {
    for (const k of changed) {
      if (flags.values) {
        console.log(`  ${fmt.warn('~')} ${k}`);
        console.log(`    ${fmt.dim(name1 + ':')} ${env1.vars[k].value}`);
        console.log(`    ${fmt.dim(name2 + ':')} ${env2.vars[k].value}`);
      } else {
        console.log(`  ${fmt.warn('~')} ${k}  ${fmt.dim('(different values)')}`);
      }
    }
  }

  const total = added.length + removed.length + changed.length;

  console.log();
  if (total === 0) {
    console.log(fmt.success('✓ Files are identical!'));
  } else {
    console.log(fmt.dim(`${total} difference(s): ${added.length} added, ${removed.length} removed, ${changed.length} changed`));
  }

  if (total > 0) process.exit(1);
}

module.exports = { run };
