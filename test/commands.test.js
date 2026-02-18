'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CLI = path.join(__dirname, '..', 'bin', 'cli.js');
const TMP = path.join(__dirname, '.tmp');

function run(args, opts = {}) {
  try {
    const result = execFileSync(process.execPath, [CLI, ...args], {
      cwd: opts.cwd || TMP,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
      timeout: 5000,
    });
    return { stdout: result, code: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', code: err.status };
  }
}

describe('CLI commands', () => {
  beforeEach(() => {
    fs.mkdirSync(TMP, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TMP, { recursive: true, force: true });
  });

  describe('help', () => {
    it('shows help with --help', () => {
      const { stdout } = run(['--help']);
      assert.match(stdout, /env-doctor/);
      assert.match(stdout, /check/);
    });

    it('shows help with no command', () => {
      const { stdout } = run([]);
      assert.match(stdout, /Usage/);
    });
  });

  describe('check', () => {
    it('passes when env matches example', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\nBAZ=qux\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'FOO=\nBAZ=\n');
      const { stdout, code } = run(['check']);
      assert.equal(code, 0);
      assert.match(stdout, /All variables accounted for/);
    });

    it('fails when env is missing vars from example', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'FOO=\nBAZ=\n');
      const { stdout, code } = run(['check']);
      assert.equal(code, 1);
      assert.match(stdout, /Missing/);
    });

    it('warns about extra vars', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\nEXTRA=yes\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'FOO=\n');
      const { stdout } = run(['check']);
      assert.match(stdout, /EXTRA/);
    });

    it('validates against .env.schema', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'PORT=abc\n');
      fs.writeFileSync(path.join(TMP, '.env.schema'), 'PORT=required,number\n');
      const { stdout, code } = run(['check']);
      assert.equal(code, 1);
      assert.match(stdout, /number/i);
    });
  });

  describe('diff', () => {
    it('reports identical files', () => {
      fs.writeFileSync(path.join(TMP, 'a.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, 'b.env'), 'FOO=bar\n');
      const { stdout, code } = run(['diff', path.join(TMP, 'a.env'), path.join(TMP, 'b.env')]);
      assert.equal(code, 0);
      assert.match(stdout, /identical/i);
    });

    it('reports differences', () => {
      fs.writeFileSync(path.join(TMP, 'a.env'), 'FOO=bar\nONLY_A=1\n');
      fs.writeFileSync(path.join(TMP, 'b.env'), 'FOO=baz\nONLY_B=2\n');
      const { stdout, code } = run(['diff', path.join(TMP, 'a.env'), path.join(TMP, 'b.env')]);
      assert.equal(code, 1);
      assert.match(stdout, /ONLY_A/);
      assert.match(stdout, /ONLY_B/);
      assert.match(stdout, /FOO/);
    });
  });

  describe('mask', () => {
    it('masks sensitive values', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'API_KEY=supersecretkey123\nAPP_NAME=myapp\n');
      const { stdout, code } = run(['mask']);
      assert.equal(code, 0);
      assert.match(stdout, /API_KEY=sup\*+/);
      assert.match(stdout, /APP_NAME=myapp/);
    });

    it('masks all values with --mask-all', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'APP_NAME=myapp\n');
      const { stdout } = run(['mask', '--mask-all']);
      assert.ok(!stdout.includes('myapp'));
    });
  });

  describe('init', () => {
    it('generates .env.example', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'APP=myapp\nSECRET_KEY=abc123\n');
      const { code } = run(['init']);
      assert.equal(code, 0);
      const example = fs.readFileSync(path.join(TMP, '.env.example'), 'utf8');
      assert.match(example, /APP=myapp/);
      assert.match(example, /SECRET_KEY=$/m);  // sensitive value stripped
    });

    it('refuses to overwrite without --force', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'existing\n');
      const { code } = run(['init']);
      assert.equal(code, 1);
    });

    it('overwrites with --force', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      fs.writeFileSync(path.join(TMP, '.env.example'), 'existing\n');
      const { code } = run(['init', '--force']);
      assert.equal(code, 0);
    });

    it('dry-run prints to stdout', () => {
      fs.writeFileSync(path.join(TMP, '.env'), 'FOO=bar\n');
      const { stdout, code } = run(['init', '--dry-run']);
      assert.equal(code, 0);
      assert.match(stdout, /FOO=bar/);
    });
  });

  describe('error handling', () => {
    it('fails gracefully on unknown command', () => {
      const { code, stderr } = run(['bogus']);
      assert.equal(code, 1);
    });

    it('fails gracefully when .env is missing', () => {
      const { code } = run(['check']);
      assert.equal(code, 1);
    });
  });
});
