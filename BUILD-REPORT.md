# env-doctor — Phase 1 Build Report

**Date:** 2026-02-18
**Status:** ✅ Complete — all 50 tests passing

## What Was Done

### Architecture (full rewrite from prototype)
- **`src/parser.js`** — .env and .env.schema parsing (DSL + JSON)
- **`src/validator.js`** — schema validation, heuristic checks, type inference
- **`src/format.js`** — color output with NO_COLOR support
- **`src/commands/`** — one module per command (check, diff, mask, init)
- **`bin/cli.js`** — clean arg parsing and command routing

### Commands Implemented
| Command | Description |
|---------|-------------|
| `check` | Validates .env against .env.schema (types, patterns, enums, min/max) or .env.example (key presence). Heuristic checks for insecure defaults, invalid ports. |
| `diff` | Compares two env files — shows added, removed, changed. Optional `--values` flag. Exit code 1 on differences. |
| `mask` | Outputs .env with sensitive values masked. Supports `--mask-all`, `--output`, schema `secret` flag. Preserves comments and structure. |
| `init` | Generates .env.example from .env. Auto-strips sensitive values. Supports `--strip-values`, `--dry-run`, `--force`. |

### Schema Spec (`.env.schema`)
Simple DSL format: `KEY=required,type,rule:value`
- Tokens: `required`, `optional`, `string`, `number`, `boolean`, `url`, `email`, `ip`, `secret`, `default:`, `min:`, `max:`, `pattern:`, `enum:`
- Also supports JSON format

### Tests — 50 passing
- `test/parser.test.js` — 15 tests (env parsing, schema DSL, rule tokens)
- `test/validator.test.js` — 15 tests (schema validation, heuristics, type inference)
- `test/commands.test.js` — 20 tests (full CLI integration tests for all 4 commands + error handling)

### Files
```
bin/cli.js              — CLI entry point
src/index.js            — public API
src/parser.js           — env + schema parsing
src/validator.js        — validation engine
src/format.js           — terminal formatting
src/commands/check.js   — check command
src/commands/diff.js    — diff command
src/commands/mask.js    — mask command
src/commands/init.js    — init command
test/parser.test.js     — parser unit tests
test/validator.test.js  — validator unit tests
test/commands.test.js   — CLI integration tests
package.json            — proper metadata, bin, engines, files
README.md               — professional docs with examples
LICENSE                 — MIT
```

## Quality Notes
- Zero dependencies
- Node 18+ (uses built-in `node:test`)
- Color output with `NO_COLOR` env var support
- Graceful error handling throughout
- Exit codes for CI integration
- Preserves .env file structure (comments, blank lines) in mask/init
