# env-doctor 🩺

Diagnose, validate, and manage your `.env` files. Find missing vars, catch type mismatches, and keep environments in sync.

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

## CI Integration

```yaml
# GitHub Actions
- run: npx env-doctor check --strict
```

Exit codes: `0` = all good, `1` = errors found.

## License

MIT © Atyah Labs
