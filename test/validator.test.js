'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateAgainstSchema, detectIssues, inferType } = require('../src/validator');

describe('validateAgainstSchema', () => {
  it('reports missing required variables', () => {
    const vars = {};
    const schema = { DB_URL: { required: true, type: 'url' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].level, 'error');
    assert.match(issues[0].message, /missing/i);
  });

  it('reports empty required variables', () => {
    const vars = { DB_URL: { value: '' } };
    const schema = { DB_URL: { required: true, type: 'url' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
  });

  it('passes valid required variable', () => {
    const vars = { DB_URL: { value: 'http://localhost:5432' } };
    const schema = { DB_URL: { required: true, type: 'url' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 0);
  });

  it('validates number type', () => {
    const vars = { PORT: { value: 'abc' } };
    const schema = { PORT: { required: true, type: 'number' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /number/i);
  });

  it('validates boolean type', () => {
    const vars = { DEBUG: { value: 'maybe' } };
    const schema = { DEBUG: { required: false, type: 'boolean' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
  });

  it('validates min length', () => {
    const vars = { KEY: { value: 'ab' } };
    const schema = { KEY: { required: true, type: 'string', min: 5 } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /short/i);
  });

  it('validates max length', () => {
    const vars = { KEY: { value: 'abcdefghij' } };
    const schema = { KEY: { required: false, type: 'string', max: 5 } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /long/i);
  });

  it('validates pattern', () => {
    const vars = { APP: { value: 'Hello World' } };
    const schema = { APP: { required: false, type: 'string', pattern: '^[a-z-]+$' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /pattern/i);
  });

  it('validates enum', () => {
    const vars = { ENV: { value: 'test' } };
    const schema = { ENV: { required: false, type: 'string', enum: ['dev', 'staging', 'prod'] } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 1);
    assert.match(issues[0].message, /one of/i);
  });

  it('skips optional missing variables', () => {
    const vars = {};
    const schema = { OPT: { required: false, type: 'string' } };
    const issues = validateAgainstSchema(vars, schema);
    assert.equal(issues.length, 0);
  });
});

describe('detectIssues', () => {
  it('warns on empty values', () => {
    const issues = detectIssues('ANYTHING', '');
    assert.equal(issues.length, 1);
    assert.equal(issues[0].level, 'warn');
  });

  it('detects insecure defaults for sensitive keys', () => {
    const issues = detectIssues('API_KEY', 'changeme');
    assert.ok(issues.some(i => i.level === 'error'));
  });

  it('detects invalid port numbers', () => {
    const issues = detectIssues('APP_PORT', '99999');
    assert.ok(issues.some(i => i.level === 'error'));
  });

  it('returns nothing for normal values', () => {
    const issues = detectIssues('APP_NAME', 'my-app');
    assert.equal(issues.length, 0);
  });
});

describe('inferType', () => {
  it('infers boolean', () => assert.equal(inferType('true'), 'boolean'));
  it('infers number', () => assert.equal(inferType('3000'), 'number'));
  it('infers url', () => assert.equal(inferType('https://example.com'), 'url'));
  it('infers email', () => assert.equal(inferType('a@b.com'), 'email'));
  it('infers string fallback', () => assert.equal(inferType('hello'), 'string'));
});
