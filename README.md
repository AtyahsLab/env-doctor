# env-doctor 🩺

[![npm version](https://img.shields.io/npm/v/@atyahassis/env-doctor)](https://www.npmjs.com/package/@atyahassis/env-doctor)
[![license](https://img.shields.io/npm/l/@atyahassis/env-doctor)](./LICENSE)
[![node](https://img.shields.io/node/v/@atyahassis/env-doctor)](https://nodejs.org)
[![tests](https://img.shields.io/badge/tests-66%20passing-brightgreen)](#)

Diagnose, validate, and manage your `.env` files. Find missing vars, catch type mismatches, and keep environments in sync.

> **Zero dependencies.** Pure Node.js. Works with any framework.

```
$ env-doctor check

Checking .env against .env.schema

  ✗ DATABASE_URL: Required variable is missing or empty
  ✗ PORT: Expected a number, got: "abc"

Result: 2 error(s)
```

## Install

```bash
npm install -g env-doctor
```

Or use without installing:

```bash
npx env-doctor check
```

## Commands

### `env-doctor check [dir]`

Validate your `.env` against a `.env.schema` (preferred) or `.env.example`.

```bash
env-doctor check              # current directory
env-doctor check ./backend    # specific directory
env-doctor check --strict     # treat warnings as errors
```

If a `.env.schema` exists, env-doctor validates types, patterns, enums, and required fields. Otherwise, it falls back to checking key presence against `.env.example`.

### `env-doctor diff <file1> <file2>`

Compare two env files side by side. Great for spotting drift between environments.

```bash
env-doctor diff .env .env.staging
env-doctor diff .env.local .env.production --values  # show actual values
```

```
Comparing .env ↔ .env.staging

  - LOCAL_ONLY  (only in .env)
  + REDIS_URL   (only in .env.staging)
  ~ API_URL     (different values)

3 difference(s): 1 added, 1 removed, 1 changed
```

### `env-doctor mask [dir]`

Print your `.env` with sensitive values masked. Safe for sharing in logs, PRs, or Slack.

```bash
env-doctor mask                  # masks sensitive keys (password, token, key, etc.)
env-doctor mask --mask-all       # mask everything
env-doctor mask --output=.env.masked  # write to file
```

```
DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=sk-*********
JWT_SECRET=myS*********
APP_NAME=my-cool-app
PORT=3000
```

### `env-doctor init [dir]`

Generate a `.env.example` from an existing `.env`. Sensitive values are automatically stripped.

```bash
env-doctor init                  # generates .env.example
env-doctor init --strip-values   # strip ALL values
env-doctor init --dry-run        # preview without writing
env-doctor init --force          # overwrite existing
```

### `env-doctor sync [dir]`

Sync your `.env` with a `.env.schema` or `.env.example`. Adds missing variables, preserves existing values, and warns about orphaned vars.

```bash
env-doctor sync                      # interactive — prompts for missing values
env-doctor sync --non-interactive    # use defaults or leave empty
env-doctor sync --dry-run            # preview what would change
env-doctor sync -f .env.local        # sync a different env file
env-doctor sync -s custom.schema     # use a custom schema file
```

```
Syncing .env with .env.schema

  ⚠ Orphaned variables (not in .env.schema):
    ! OLD_UNUSED_VAR

  Variables to add:
    + PORT=3000 (default)
    + API_KEY= (empty)

  ✓ Written .env (2 variable(s) added)
```

**How it works:**
1. Reads `.env.schema` (or `.env.example` as fallback)
2. Reads your existing `.env` (if it exists)
3. For missing variables: uses schema defaults, example values, or prompts you
4. Warns about variables in `.env` that aren't in the schema
5. Writes the updated `.env`, preserving all existing content

## Schema Format (`.env.schema`)

Define validation rules for your env vars. Simple DSL — one variable per line:

```ini
# Database
DATABASE_URL=required,url
DB_POOL_SIZE=number,default:5

# App
NODE_ENV=required,enum:development|staging|production
APP_NAME=required,string,min:1,max:50
DEBUG=boolean,default:false

# Secrets
API_KEY=required,string,secret,min:16
JWT_SECRET=required,secret,min:32,pattern:^[A-Za-z0-9+/=_-]+$
```

### Supported Rules

| Token | Description |
|-------|-------------|
| `required` | Must be present and non-empty |
| `optional` | May be absent (default) |
| `string` | Any string (default type) |
| `number` | Must be numeric |
| `boolean` | Must be `true`, `false`, `0`, `1`, `yes`, or `no` |
| `url` | Must start with `http://` or `https://` |
| `email` | Must be a valid email format |
| `ip` | Must be an IPv4 address |
| `secret` | Marks as sensitive (used by `mask` command) |
| `default:<value>` | Default value (documentation) |
| `min:<n>` | Minimum length |
| `max:<n>` | Maximum length |
| `pattern:<regex>` | Must match regex pattern |
| `enum:<a\|b\|c>` | Must be one of the listed values |

The schema also supports JSON format:

```json
{
  "DATABASE_URL": "required,url",
  "PORT": { "required": true, "type": "number", "default": "3000" }
}
```

## Options

| Flag | Description |
|------|-------------|
| `--strict` | Exit with error on warnings too |
| `--env=<file>` | Custom env file name (default: `.env`) |
| `--example=<file>` | Custom example file name |
| `--values` | Show values in diff output |
| `--mask-all` | Mask all values, not just sensitive ones |
| `--strip-values` | Strip all values in init |
| `--output=<file>` | Write output to file |
| `--force` | Overwrite existing files |
| `--dry-run` | Preview without writing |
| `--no-heuristics` | Skip heuristic checks |
| `--non-interactive` | Skip prompts in sync (use defaults or leave empty) |
| `-f, --file=<file>` | Target env file for sync (default: `.env`) |
| `-s, --schema=<file>` | Schema file for sync (default: `.env.schema`) |

### `env-doctor fix [dir]`

Auto-fix your `.env` based on `.env.schema`. Adds missing variables, removes orphans, and sorts to match schema order.

```bash
env-doctor fix                      # add missing vars with defaults
env-doctor fix --dry-run            # preview changes without writing
env-doctor fix --remove-orphans     # comment out vars not in schema
env-doctor fix --sort               # reorder to match schema order
env-doctor fix --sort --remove-orphans --dry-run  # full preview
```

```
env-doctor fix

  Added 2 missing variable(s):
    + PORT (default: 3000)
    + API_KEY (empty)

  Commented out 1 orphaned variable(s):
    - OLD_UNUSED_VAR

  ↕ Reordered variables to match schema order

  ✓ Written .env
```

## GitHub Action

Use env-doctor directly in your CI pipeline. It validates `.env` files on every push and PR, and posts a summary comment on PRs.

```yaml
# .github/workflows/env-check.yml
name: Validate env files

on:
  push:
    branches: [main]
  pull_request:

jobs:
  env-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: AtyahsLab/env-doctor@v1
        with:
          schema: '.env.schema'        # path to schema (default: .env.schema)
          env-files: '.env,.env.test'   # comma-separated list (default: .env)
          fail-on-warn: 'false'         # fail on warnings too (default: false)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The action will:
- ✅ Validate all specified `.env` files against your schema
- ❌ Fail the workflow if errors are found
- 💬 Post a summary table as a PR comment (updated on each push)
- 📊 Write results to the GitHub Actions job summary

## CI Integration

```yaml
# Simple usage with npx
- run: npx env-doctor check --strict
```

Exit codes: `0` = all good, `1` = errors found.

## Why env-doctor?

- 🔍 **Find missing vars** before your app crashes at runtime
- 📐 **Schema validation** — types, patterns, enums, ranges
- 🔒 **Mask secrets** for safe sharing in logs and PRs
- 🔄 **Diff environments** — spot drift between local, staging, production
- 📦 **Zero dependencies** — nothing to audit, nothing to break
- ⚡ **Fast** — 50 tests run in <1s

## Contributing

Issues and PRs welcome at [github.com/AtyahsLab/env-doctor](https://github.com/AtyahsLab/env-doctor).

## License

MIT © Atyah Labs
