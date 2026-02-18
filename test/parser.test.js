'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseEnvString, parseRuleTokens, parseSchemaDSL } = require('../src/parser');

describe('parseEnvString', () => {
  it('parses basic key=value pairs', () => {
    const result = parseEnvString('FOO=bar\nBAZ=qux');
    assert.equal(result.vars.FOO.value, 'bar');
    assert.equal(result.vars.BAZ.value, 'qux');
    assert.deepEqual(result.order, ['FOO', 'BAZ']);
  });

  it('handles quoted values', () => {
    const result = parseEnvString('A="hello world"\nB=\'single\'');
    assert.equal(result.vars.A.value, 'hello world');
    assert.equal(result.vars.B.value, 'single');
  });

  it('handles empty values', () => {
    const result = parseEnvString('EMPTY=\nALSO=');
    assert.equal(result.vars.EMPTY.value, '');
    assert.equal(result.vars.ALSO.value, '');
  });

  it('skips comments and blank lines', () => {
    const result = parseEnvString('# comment\n\nFOO=bar\n# another\nBAR=baz');
    assert.deepEqual(result.order, ['FOO', 'BAR']);
  });

  it('handles values with = signs', () => {
    const result = parseEnvString('URL=postgres://user:pass@host/db?opt=1');
    assert.equal(result.vars.URL.value, 'postgres://user:pass@host/db?opt=1');
  });

  it('handles inline comments for unquoted values', () => {
    const result = parseEnvString('PORT=3000 # web server port');
    assert.equal(result.vars.PORT.value, '3000');
  });

  it('preserves comment from preceding line', () => {
    const result = parseEnvString('# The database URL\nDB_URL=localhost');
    assert.equal(result.vars.DB_URL.comment, 'The database URL');
  });

  it('handles lines without = sign', () => {
    const result = parseEnvString('NOEQ\nFOO=bar');
    assert.deepEqual(result.order, ['FOO']);
  });
});

describe('parseRuleTokens', () => {
  it('parses required,type', () => {
    const rule = parseRuleTokens(['required', 'url']);
    assert.equal(rule.required, true);
    assert.equal(rule.type, 'url');
  });

  it('parses default and min/max', () => {
    const rule = parseRuleTokens(['number', 'default:3000', 'min:1', 'max:10']);
    assert.equal(rule.type, 'number');
    assert.equal(rule.default, '3000');
    assert.equal(rule.min, 1);
    assert.equal(rule.max, 10);
  });

  it('parses enum', () => {
    const rule = parseRuleTokens(['required', 'enum:dev|staging|prod']);
    assert.deepEqual(rule.enum, ['dev', 'staging', 'prod']);
  });

  it('parses pattern', () => {
    const rule = parseRuleTokens(['pattern:^[a-z]+$']);
    assert.equal(rule.pattern, '^[a-z]+$');
  });

  it('parses secret flag', () => {
    const rule = parseRuleTokens(['required', 'string', 'secret']);
    assert.equal(rule.secret, true);
  });
});

describe('parseSchemaDSL', () => {
  it('parses multi-line schema', () => {
    const schema = parseSchemaDSL('DB_URL=required,url\nPORT=number,default:3000\n# comment\nDEBUG=boolean');
    assert.equal(schema.DB_URL.required, true);
    assert.equal(schema.DB_URL.type, 'url');
    assert.equal(schema.PORT.type, 'number');
    assert.equal(schema.PORT.default, '3000');
    assert.equal(schema.DEBUG.type, 'boolean');
  });

  it('handles empty rule', () => {
    const schema = parseSchemaDSL('FOO=');
    assert.equal(schema.FOO.required, false);
    assert.equal(schema.FOO.type, 'string');
  });
});
