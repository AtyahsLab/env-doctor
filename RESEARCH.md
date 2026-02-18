# env-doctor — Competitive Research

> Last updated: 2026-02-18 | Data from npm & GitHub APIs

## Our Product: env-doctor 🩺

- **npm**: `@atyahassis/env-doctor` v1.1.0
- **GitHub**: [AtyahsLab/env-doctor](https://github.com/AtyahsLab/env-doctor) — ⭐ 0 stars, created today (2026-02-18)
- **Weekly downloads**: New — not yet tracked
- **Current features**: check, diff, mask, init, sync, schema validation (DSL + JSON), type checking, pattern matching, enums, secrets masking
- **Positioning**: Zero-dependency CLI for .env validation & management
- **Pricing**: Free / MIT

---

## Competitor Landscape

### 1. env-cmd
| Metric | Value |
|--------|-------|
| GitHub | [toddbluhm/env-cmd](https://github.com/toddbluhm/env-cmd) |
| ⭐ Stars | 1,814 |
| 📦 Weekly downloads | **1,381,003** |
| Language | TypeScript |
| Pricing | Free / MIT |

**What it does**: Loads env vars from a file and runs a command with them. Think `env-cmd -f .env node server.js`.

**Features we DON'T have**:
- Run commands with env vars injected (`env-cmd -f .env <command>`)
- Multi-environment file support (`.env-cmdrc` with dev/staging/prod profiles)
- Environment variable expansion/interpolation
- Graceful env file fallback chains
- Override existing env vars with `--no-override`

**Overlap**: Minimal — env-cmd is a *runner*, env-doctor is a *validator*. Complementary tools.

---

### 2. envalid
| Metric | Value |
|--------|-------|
| GitHub | [af/envalid](https://github.com/af/envalid) |
| ⭐ Stars | 1,541 |
| 📦 Weekly downloads | **407,752** |
| Language | TypeScript |
| Pricing | Free / MIT |

**What it does**: Programmatic runtime validation of `process.env` with typed validators. Used *inside* application code, not as a CLI.

**Features we DON'T have**:
- **Programmatic API** (import and use in app code, not just CLI)
- **TypeScript type inference** — validated env returns typed object
- **Custom validators** — write your own validator functions
- **Built-in validators**: `str()`, `bool()`, `num()`, `email()`, `host()`, `port()`, `url()`, `json()`
- **Reporter customization** — custom error formatting
- **Bun & Deno support** explicitly
- **Middleware pattern** — `cleanEnv()` returns immutable proxy

**Key insight**: envalid is a **library** (imported in code), env-doctor is a **CLI tool** (run in terminal/CI). Different use cases, but many users want both.

---

### 3. dotenv-safe
| Metric | Value |
|--------|-------|
| GitHub | [rolodato/dotenv-safe](https://github.com/rolodato/dotenv-safe) |
| ⭐ Stars | 770 |
| 📦 Weekly downloads | **174,048** |
| Language | JavaScript |
| Pricing | Free / MIT |

**What it does**: Drop-in replacement for `dotenv` that ensures all vars in `.env.example` are defined. Crashes on boot if missing.

**Features we DON'T have**:
- **Drop-in dotenv replacement** (`require('dotenv-safe').config()`)
- **Automatic process.env loading** + validation in one call
- **allowEmptyValues** option
- Supports `path` and `example` config options

**Key insight**: Very similar problem space to our `check` command, but as a library. Aging project (simple scope, not much innovation left).

---

### 4. dotenv-linter (Rust)
| Metric | Value |
|--------|-------|
| GitHub | [dotenv-linter/dotenv-linter](https://github.com/dotenv-linter/dotenv-linter) |
| ⭐ Stars | **2,056** |
| 📦 Weekly downloads (npm) | 750 (wrapper only; mostly installed via cargo/brew) |
| Language | Rust |
| Pricing | Free / MIT |

**What it does**: Lightning-fast .env linter with check/fix/diff commands. Focuses on *formatting* and *style* rather than value validation.

**Features we DON'T have**:
- **Auto-fix** (`dotenv-linter fix`) — automatically corrects issues
- **14 built-in lint checks**: duplicate keys, trailing whitespace, incorrect delimiters, unordered keys, lowercase keys, extra blank lines, etc.
- **Schema violation checking**
- **GitHub Action** ([action-dotenv-linter](https://github.com/dotenv-linter/action-dotenv-linter))
- **reviewdog integration**
- **Super-Linter integration**
- Blazing fast (Rust binary)

**Key insight**: **Our closest competitor in spirit.** They focus on linting *syntax/style*; we focus on *validation/management*. We should add their style checks AND keep our unique management features (mask, sync, init).

---

### 5. znv
| Metric | Value |
|--------|-------|
| GitHub | [lostfictions/znv](https://github.com/lostfictions/znv) |
| ⭐ Stars | 387 |
| 📦 Weekly downloads | **49,650** |
| Language | TypeScript |
| Pricing | Free / MIT |

**What it does**: Environment variable validation using **Zod schemas**. Type-safe parsing with full Zod power.

**Features we DON'T have**:
- **Zod schema support** — use any Zod schema for validation
- **Full TypeScript type inference**
- **Complex transforms** — coerce, preprocess, refine
- **Composable schemas** — reuse Zod schemas across app

**Key insight**: Appeals to the "Zod everywhere" crowd. A library, not a CLI. Growing fast for its niche.

---

## Competitive Summary

| Tool | Type | Stars | Weekly DLs | Primary Use |
|------|------|-------|-----------|-------------|
| **env-cmd** | CLI runner | 1,814 | 1.38M | Run commands with env vars |
| **dotenv-linter** | CLI linter | 2,056 | 750* | Lint .env syntax/style |
| **envalid** | Library | 1,541 | 408K | Runtime env validation |
| **dotenv-safe** | Library | 770 | 174K | Boot-time env checking |
| **znv** | Library | 387 | 50K | Zod-based env validation |
| **env-doctor** | CLI toolkit | 0 | new | Validate, diff, mask, manage |

*dotenv-linter is primarily distributed via cargo/brew, not npm

## Market Gaps We Can Exploit

1. **No single CLI tool does validation + management + linting** — we're the closest
2. **No GitHub Action** for comprehensive .env validation (dotenv-linter has one, but only for style)
3. **No tool generates env documentation** from schemas
4. **No tool handles monorepo .env management** well
5. **CI/CD integration** is underserved — most tools are libraries, not CI-friendly CLIs
6. **Encryption/secrets** — no competitor handles encrypted .env files

---

## Feature Gap Analysis — Top 10 Features to Add (Ranked by Impact)

### 1. 🏆 GitHub Action (Impact: CRITICAL)
**Why**: Instant distribution to millions of GitHub repos. dotenv-linter's GitHub Action drives significant adoption. A `env-doctor/action` that runs `check` on PRs would be our biggest growth lever.
**Effort**: Low (1-2 days)
**Competitors**: dotenv-linter has one; envalid/znv don't (library-only)

### 2. 🏆 Auto-fix Command (Impact: HIGH)
**Why**: dotenv-linter's `fix` command is beloved. Auto-fixing missing vars (from defaults), sorting keys, fixing formatting — this makes env-doctor *actionable*, not just diagnostic.
**Effort**: Medium (3-5 days)
**Competitors**: dotenv-linter has this

### 3. 🏆 Programmatic API / `require('env-doctor')` (Impact: HIGH)
**Why**: envalid (408K/week) and dotenv-safe (174K/week) prove devs want *runtime* validation too. Offering both CLI + library doubles our addressable market.
**Effort**: Medium (2-3 days — we already have the core logic)
**Competitors**: envalid, dotenv-safe, znv

### 4. 🔥 Style/Lint Checks (Impact: HIGH)
**Why**: Add dotenv-linter-style checks (duplicate keys, trailing whitespace, incorrect delimiters, unordered keys). Makes env-doctor a superset of dotenv-linter.
**Effort**: Medium (3-4 days)
**Competitors**: dotenv-linter

### 5. 🔥 Env Documentation Generator (Impact: MEDIUM-HIGH)
**Why**: **Nobody does this.** Generate a markdown table or HTML page documenting all env vars, their types, defaults, and descriptions from the schema. Blue ocean feature.
**Effort**: Low (1-2 days)
**Competitors**: None

### 6. 🔥 TypeScript Type Generation (Impact: MEDIUM-HIGH)
**Why**: Generate a `env.d.ts` from `.env.schema` so devs get autocomplete for `process.env.MY_VAR`. Bridges the CLI→library gap without requiring runtime dependency.
**Effort**: Low (1 day)
**Competitors**: envalid and znv do this at runtime, nobody does it as codegen

### 7. 💡 Monorepo Support (Impact: MEDIUM)
**Why**: `env-doctor check --recursive` to validate all .env files in a monorepo. Check that shared vars are consistent across packages.
**Effort**: Medium (2-3 days)
**Competitors**: Nobody

### 8. 💡 CI/CD Integration Guides + Exit Codes (Impact: MEDIUM)
**Why**: Proper exit codes, `--format=json` output, CI examples for GitHub Actions, GitLab CI, CircleCI. Make it trivial to add to any pipeline.
**Effort**: Low (1 day for JSON output; docs effort)
**Competitors**: dotenv-linter has CI guides

### 9. 💡 Env Variable Encryption (Impact: MEDIUM)
**Why**: `env-doctor encrypt .env` / `env-doctor decrypt .env.enc`. Enable committing encrypted .env files to git. Appeals to security-conscious teams.
**Effort**: Medium-High (3-5 days)
**Competitors**: Nobody in this space (sops/age exist but aren't .env-specific)

### 10. 💡 VS Code Extension (Impact: MEDIUM)
**Why**: Inline validation, autocomplete from schema, hover docs for env vars. High visibility but high effort.
**Effort**: High (1-2 weeks)
**Competitors**: Some generic .env extensions exist, none with schema validation
