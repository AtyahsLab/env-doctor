# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-02-18

### Added

- `sync` command — sync `.env` with `.env.schema` or `.env.example`, adding missing variables
- `--non-interactive` flag to skip prompts and use defaults or leave empty
- `--dry-run` support for sync (preview changes without writing)
- `-f, --file` option to target a specific env file
- `-s, --schema` option to specify a custom schema file
- Interactive prompts for missing variables without defaults
- Orphaned variable warnings (vars in `.env` not in schema)

## [1.0.0] - 2026-02-18

### Added

- `check` command — validate `.env` against `.env.schema` or `.env.example`
- `diff` command — compare two env files side by side
- `mask` command — print `.env` with sensitive values masked
- `init` command — generate `.env.example` from existing `.env`
- Schema DSL with support for types, patterns, enums, min/max, defaults
- JSON schema format support
- Heuristic checks (empty values, insecure defaults, invalid ports)
- `--strict` mode for CI usage
- Zero dependencies

[1.1.0]: https://github.com/AtyahsLab/env-doctor/releases/tag/v1.1.0
[1.0.0]: https://github.com/AtyahsLab/env-doctor/releases/tag/v1.0.0
