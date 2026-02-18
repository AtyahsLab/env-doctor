'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'cli.js');
const TMP = path.join(__dirname, '.tmp-sync');

function run(args, opts = {}) {
  try {
    const result = execFileSync(process.execPath, [CLI, ...args], {
      cwd: opts.cwd || TMP,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
      timeout: 5000,
      input: opts.input || undefined,
    });
    return { stdout: result, code: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', code: err.status };
  }
}

describe('sync command', () => {
  beforeEach(() => {
    fs.mkdirSync(TMP, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TMP, { recursive: true, force: true });
  });

  describe('with .env.schema', () => {
    it('adds missing vars with defaults from schema', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'EXISTING=hello\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'EXISTING=required,string\nPORT=number,default:3000\nDEBUG=boolean,default:false\n');
      const { stdout, code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      assert.match(stdout, /PORT/);
      assert.match(stdout, /DEBUG/);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /EXISTING=hello/);
      assert.match(env, /PORT=3000/);
      assert.match(env, /DEBUG=false/);
    });

    it('leaves missing vars empty in non-interactive mode when no default', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'FOO=required\nAPI_KEY=required,secret\n');
      const { code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /FOO=bar/);
      assert.match(env, /API_KEY=/);
    });

    it('warns about orphaned variables', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\nORPHAN=yes\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'FOO=required\n');
      const { stdout, code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      assert.match(stdout, /ORPHAN/);
      assert.match(stdout, /[Oo]rphan/);
    });

    it('reports already in sync', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'FOO=required\n');
      const { stdout, code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      assert.match(stdout, /in sync/i);
    });

    it('dry-run does not write file', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'FOO=required\nNEW_VAR=string,default:hello\n');
      const { stdout, code } = run(['sync', '--non-interactive', '--dry-run']);
      assert.equal(code, 0);
      assert.match(stdout, /[Dd]ry run/);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.ok(!env.includes('NEW_VAR'));
    });
  });

  describe('with .env.example', () => {
    it('adds missing vars from example', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=myval\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'FOO=example\nBAR=default_bar\n');
      const { stdout, code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /FOO=myval/);       // preserved
      assert.match(env, /BAR=default_bar/);  // added from example
    });

    it('warns about orphaned vars with example', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\nEXTRA=yes\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'FOO=\n');
      const { stdout } = run(['sync', '--non-interactive']);
      assert.match(stdout, /EXTRA/);
    });
  });

  describe('with no existing .env', () => {
    it('creates .env from schema defaults', () => {
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'PORT=number,default:3000\nHOST=string,default:localhost\n');
      const { code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /PORT=3000/);
      assert.match(env, /HOST=localhost/);
    });

    it('creates .env from example', () => {
      fs.writeFileSync(path.join(TMP, '.env.example'), 'APP=myapp\nKEY=\n');
      const { code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /APP=myapp/);
      assert.match(env, /KEY=/);
    });
  });

  describe('options', () => {
    it('respects -f for target file', () => {
      fs.writeFileSync(path.join(TMP, '.env.local'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'FOO=required\nBAZ=string,default:x\n');
      const { code } = run(['sync', '--non-interactive', '-f', '.env.local']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env.local'), 'utf8');
      assert.match(env, /FOO=bar/);
      assert.match(env, /BAZ=x/);
    });

    it('respects -s for schema file', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, 'custom.schema'), 'FOO=required\nNEW=string,default:hi\n');
      const { code } = run(['sync', '--non-interactive', '-s', 'custom.schema']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /NEW=hi/);
    });

    it('fails with missing custom schema file', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      const { code } = run(['sync', '-s', 'nonexistent.schema']);
      assert.equal(code, 1);
    });

    it('fails when no schema or example exists', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      const { code } = run(['sync']);
      assert.equal(code, 1);
    });
  });

  describe('preserves existing content', () => {
    it('preserves comments and blank lines', () => {
      const original = '# Database config\nDB_HOST=localhost\n\n# App\nAPP_NAME=test\n';
      fs.writeFileSync(path.join(TMP, '.env'), original);
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'DB_HOST=required\nAPP_NAME=required\nPORT=number,default:8080\n');
      const { code } = run(['sync', '--non-interactive']);
      assert.equal(code, 0);
      const env = fs.readFileSync(path.join(TMP, '.env'), 'utf8');
      assert.match(env, /# Database config/);
      assert.match(env, /DB_HOST=localhost/);
      assert.match(env, /# App/);
      assert.match(env, /APP_NAME=test/);
      assert.match(env, /PORT=8080/);
    });
  });

  describe('buildSync unit tests', () => {
    const { buildSync } = require('../src/commands/sync');

    it('returns correct added and orphaned lists', () => {
      const envData = {
        vars: { FOO: { value: 'bar' }, ORPHAN: { value: 'x' } },
        order: ['FOO', 'ORPHAN'],
        _raw: 'FOO=bar\nORPHAN=x\n',
      };
      const schema = {
        FOO: { required: true, type: 'string' },
        NEW: { required: false, type: 'number', default: '42' },
      };

      const result = buildSync(envData, schema, null, {});
      assert.deepEqual(result.orphaned, ['ORPHAN']);
      assert.equal(result.added.length, 1);
      assert.equal(result.added[0].key, 'NEW');
      assert.equal(result.added[0].value, '42');
      assert.match(result.content, /FOO=bar/);
      assert.match(result.content, /NEW=42/);
    });

    it('handles null envData (no existing .env)', () => {
      const schema = {
        A: { required: true, type: 'string', default: 'hello' },
        B: { required: true, type: 'string' },
      };
      const result = buildSync(null, schema, null, { B: 'world' });
      assert.equal(result.added.length, 2);
      assert.match(result.content, /A=hello/);
      assert.match(result.content, /B=world/);
    });
  });
});
