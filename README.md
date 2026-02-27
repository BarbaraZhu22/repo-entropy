# repo-entropy-analyzer

[![npm version](https://img.shields.io/npm/v/repo-entropy-analyzer)](https://www.npmjs.com/package/repo-entropy-analyzer)
[![license](https://img.shields.io/npm/l/repo-entropy-analyzer)](./LICENSE)

A CLI tool that scans a repository and generates a markdown report describing **code entropy** — dead code, duplications, excessive complexity, and bloated files — problems commonly introduced by AI-generated code.

## Why?

AI coding assistants often introduce subtle quality issues: unused imports, duplicated logic across files, deeply nested control flow, and files that keep growing. These accumulate over time and degrade your codebase. `repo-entropy-analyzer` detects them and gives you an actionable report.

## Install

```bash
npm install -g repo-entropy-analyzer
```

Or run directly with `npx`:

```bash
npx repo-entropy-analyzer analyze .
```

## Usage

```bash
repo-entropy analyze <path>
```

Analyze the current directory:

```bash
repo-entropy analyze .
```

Analyze a specific project:

```bash
repo-entropy analyze ./my-project
```

### Options

| Flag        | Description              |
|-------------|--------------------------|
| `--help`    | Show usage information   |
| `--version` | Show version number      |

## What It Detects

| Category           | What                                     | Severity  |
|--------------------|------------------------------------------|-----------|
| **Dead Code**      | Unused imports, exported but unused funcs | Score × 2 |
| **Similar Code**   | Duplicate / near-duplicate function bodies | Score × 3 |
| **Long Files**     | Files > 500 lines (warning) or > 1000 lines (critical) | Score × 1.5 |
| **Deep Complexity**| Functions with nesting depth > 4         | Score × 2 |

## Output

The tool generates an `entropy-report.md` file in the target directory with:

- **Entropy Score** (0–100) — higher means more problems
- Categorized findings with file paths and descriptions

Example:

```
# Repo Entropy Report

## Summary
Entropy Score: 34 / 100

## Dead Code
- src/utils/legacy.ts — Unused import: lodash
- src/helpers/format.ts — Exported function `formatDate` is never used

## Long Files
- src/components/Dashboard.tsx — 847 lines (Warning: exceeds 500)

## Similar Code
- src/api/users.ts:`fetchUser` ≈ src/api/posts.ts:`fetchPost`

## Deep Complexity
- src/services/auth.ts:`validateToken` — nesting depth 6
```

## Supported File Types

`.ts`, `.tsx`, `.js`, `.jsx`

## Ignored Paths

By default, the following are ignored:

- `node_modules/`
- `dist/`, `build/`
- `.git/`
- `*.generated.*`
- Patterns from `.gitignore`

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](./LICENSE)
