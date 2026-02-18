'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildFix } = require('../src/commands/fix');
const { parseEnvString, parseSchemaDSL } = require('../src/parser');

function schema(dsl) {
  return parseSchemaDSL(dsl);
}

function env(str) {
  return parseEnvString(str);
}

describe('fix — buildFix', () => {
  it('adds missing variables with defaults', () => {
    const s = schema('PORT=number,default:3000\nHOST=string,default:localhost');
    const e = env('PORT=8080');
    const result = buildFix(e, s, {});
    assert.equal(result.added.length, 1);
    assert.equal(result.added[0].key, 'HOST');
    assert.equal(result.added[0].value, 'localhost');
    assert.ok(result.content.includes('HOST=localhost'));
  });

  it('adds missing variables with empty value when no default', () => {
    const s = schema('API_KEY=required,string');
    const e = env('');
    const result = buildFix(e, s, {});
    assert.equal(result.added.length, 1);
    assert.equal(result.added[0].value, '');
    assert.ok(result.content.includes('API_KEY='));
  });

  it('adds TODO comment for variables without defaults', () => {
    const s = schema('SECRET=required,string');
    const e = env('OTHER=value');
    const result = buildFix(e, s, {});
    assert.ok(result.content.includes('# TODO: Set value for SECRET'));
  });

  it('preserves existing variables', () => {
    const s = schema('PORT=number,default:3000\nHOST=string');
    const e = env('PORT=8080');
    const result = buildFix(e, s, {});
    assert.ok(result.content.includes('PORT=8080'));
  });

  it('comments out orphaned variables with --remove-orphans', () => {
    const s = schema('PORT=number');
    const e = env('PORT=3000\nOLD_VAR=stale');
    const result = buildFix(e, s, { 'remove-orphans': true });
    assert.equal(result.removed.length, 1);
    assert.equal(result.removed[0].key, 'OLD_VAR');
    assert.ok(result.content.includes('# OLD_VAR=stale'));
  });

  it('keeps orphaned variables without --remove-orphans', () => {
    const s = schema('PORT=number');
    const e = env('PORT=3000\nOLD_VAR=stale');
    const result = buildFix(e, s, {});
    assert.equal(result.removed.length, 0);
    assert.ok(result.content.includes('OLD_VAR=stale'));
  });

  it('sorts variables to match schema order with --sort', () => {
    const s = schema('A=string\nB=string\nC=string');
    const e = env('C=3\nA=1\nB=2');
    const result = buildFix(e, s, { sort: true });
    const lines = result.content.split('\n').filter(l => l && !l.startsWith('#'));
    assert.equal(lines[0], 'A=1');
    assert.equal(lines[1], 'B=2');
    assert.equal(lines[2], 'C=3');
    assert.equal(result.reordered, true);
  });

  it('does not mark as reordered when already in schema order', () => {
    const s = schema('A=string\nB=string');
    const e = env('A=1\nB=2');
    const result = buildFix(e, s, { sort: true });
    assert.equal(result.reordered, false);
  });

  it('handles empty .env (all vars added)', () => {
    const s = schema('X=string,default:hello\nY=number,default:42');
    const result = buildFix(null, s, {});
    assert.equal(result.added.length, 2);
    assert.ok(result.content.includes('X=hello'));
    assert.ok(result.content.includes('Y=42'));
  });

  it('handles empty schema (nothing to fix if no orphan removal)', () => {
    const s = schema('');
    const e = env('FOO=bar');
    const result = buildFix(e, s, {});
    assert.equal(result.added.length, 0);
    assert.ok(result.content.includes('FOO=bar'));
  });

  it('combines --sort and --remove-orphans', () => {
    const s = schema('B=string\nA=string');
    const e = env('A=1\nORPHAN=x\nB=2');
    const result = buildFix(e, s, { sort: true, 'remove-orphans': true });
    const lines = result.content.split('\n').filter(l => l && !l.startsWith('#'));
    assert.equal(lines[0], 'B=2');
    assert.equal(lines[1], 'A=1');
    assert.equal(result.removed.length, 1);
  });

  it('preserves variable values, not schema defaults', () => {
    const s = schema('PORT=number,default:3000');
    const e = env('PORT=9999');
    const result = buildFix(e, s, {});
    assert.ok(result.content.includes('PORT=9999'));
    assert.ok(!result.content.includes('PORT=3000'));
  });

  it('reports added entries with hasDefault flag', () => {
    const s = schema('A=string,default:val\nB=string');
    const result = buildFix(null, s, {});
    const a = result.added.find(x => x.key === 'A');
    const b = result.added.find(x => x.key === 'B');
    assert.equal(a.hasDefault, true);
    assert.equal(b.hasDefault, false);
  });

  it('does not duplicate existing variables', () => {
    const s = schema('PORT=number,default:3000');
    const e = env('PORT=3000');
    const result = buildFix(e, s, {});
    const portLines = result.content.split('\n').filter(l => l.startsWith('PORT='));
    assert.equal(portLines.length, 1);
  });

  it('handles multiple orphans', () => {
    const s = schema('KEEP=string');
    const e = env('KEEP=yes\nDROP1=a\nDROP2=b\nDROP3=c');
    const result = buildFix(e, s, { 'remove-orphans': true });
    assert.equal(result.removed.length, 3);
    assert.ok(result.content.includes('# DROP1=a'));
    assert.ok(result.content.includes('# DROP2=b'));
    assert.ok(result.content.includes('# DROP3=c'));
  });

  it('content ends with trailing newline', () => {
    const s = schema('A=string');
    const e = env('A=1');
    const result = buildFix(e, s, {});
    assert.ok(result.content.endsWith('\n'));
  });

  it('handles schema with all rule types', () => {
    const s = schema('URL=required,url,default:http://localhost\nDEBUG=boolean,default:false\nCOUNT=number,default:10');
    const result = buildFix(null, s, {});
    assert.equal(result.added.length, 3);
    assert.ok(result.content.includes('URL=http://localhost'));
    assert.ok(result.content.includes('DEBUG=false'));
    assert.ok(result.content.includes('COUNT=10'));
  });

  it('returns original content for diff comparison', () => {
    const e = env('A=1\nB=2');
    const s = schema('A=string\nB=string\nC=string,default:3');
    const result = buildFix(e, s, {});
    assert.ok(result.original.includes('A=1'));
    assert.ok(result.original.includes('B=2'));
  });
});
