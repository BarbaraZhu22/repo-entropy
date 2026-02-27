You are a senior TypeScript engineer.

Your task is to generate a MINIMAL working project called:

repo-entropy-analyzer

IMPORTANT CONSTRAINTS:

* DO NOT over-engineer
* DO NOT introduce frameworks
* DO NOT add tests
* DO NOT add UI
* DO NOT add refactoring features
* ANALYSIS ONLY
* Keep implementation simple and readable
* Prefer synchronous/simple logic over abstractions

---

PROJECT GOAL

Build a CLI tool that scans a repository and generates a markdown report describing code entropy problems caused by AI-generated code.

The tool MUST NOT modify any source code.

It only detects problems.

---

TECH STACK

* Node.js
* TypeScript
* ts-morph (AST parsing)
* fast-glob (file scanning)

No other heavy dependencies.

---

FEATURES (ONLY THESE)

1. Scan repo files (.ts .tsx .js .jsx)

2. Ignore:

   * node_modules
   * dist
   * build
   * .git
   * *.generated.*

3. Analyze and detect:

A. Dead Code

* exported but unused functions
* unused imports (basic detection)

B. Long Files

* warning > 500 lines
* critical > 1000 lines

C. Similar Code (simple version)

* compare normalized function bodies
* similarity via token hashing

D. Deep Complexity

* nesting depth > 4

4. Compute entropy score:

entropy =
dead * 2 +
similar * 3 +
longFiles * 1.5 +
deepComplexity * 2

Normalize score to 0–100.

5. Generate:

entropy-report.md

---

PROJECT STRUCTURE (STRICT)

repo-entropy-analyzer/
src/
index.ts

```
scanner/
  fileScanner.ts
  ignore.ts

analyzers/
  deadCode.ts
  longFile.ts
  similarity.ts
  deepComplexity.ts
  entropyScore.ts

models/
  types.ts

report/
  reportBuilder.ts
  markdown.ts

utils/
  ast.ts
  hash.ts
```

---

ARCHITECTURE RULES

* Each analyzer exports:

  export async function analyze(files): Promise<Finding[]>

* NO classes unless absolutely necessary.

* Prefer pure functions.

* Keep files under 150 lines.

---

DATA MODELS

Create:

export interface Finding {
type:
| "dead-code"
| "long-file"
| "similar-code"
| "deep-complexity"

file: string
message: string
score: number
}

---

CLI

Command:

npx repo-entropy analyze .

Implementation can read process.argv.

---

EXECUTION FLOW

index.ts must:

1. scan files
2. build ts-morph project
3. run analyzers sequentially
4. aggregate findings
5. compute entropy
6. generate markdown report

---

OUTPUT FORMAT

# Repo Entropy Report

## Summary

Entropy Score: X / 100

## Dead Code

...

## Long Files

...

## Similar Code

...

## Deep Complexity

...

---

CODING STYLE

* clear naming
* minimal comments
* deterministic logic
* avoid async complexity unless required

---

DELIVERABLE

Generate ALL project files with full code content.
Project must compile with:

pnpm install
pnpm build
node dist/index.js analyze .

---

DO NOT EXPLAIN.

ONLY OUTPUT FILE TREE + FILE CONTENTS.
