#!/usr/bin/env node

import { resolve } from "path";
import { readFileSync, existsSync, statSync } from "fs";
import { scanFiles } from "./scanner/fileScanner";
import { createProject } from "./utils/ast";
import * as deadCode from "./analyzers/deadCode";
import * as longFile from "./analyzers/longFile";
import * as similarity from "./analyzers/similarity";
import * as deepComplexity from "./analyzers/deepComplexity";
import { buildReport, getStatusIcon } from "./report/reportBuilder";
import { generateMarkdown } from "./report/markdown";
import { Finding } from "./models/types";

const LINE_THRESHOLD = 200;

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8")
);

const DIVIDER = "\u2500".repeat(36);

function countLines(filePath: string): number {
  const content = readFileSync(filePath, "utf-8");
  return content.split("\n").length;
}

function step(msg: string) {
  console.log(`  \u2713 ${msg}`);
}

function banner() {
  console.log();
  console.log(`  \uD83E\uDDEC Repo Entropy Analyzer v${pkg.version}`);
  console.log(`  experimental entropy heuristics`);
  console.log(`  ${DIVIDER}`);
  console.log(`  Analyzing structural health of your repository...\n`);
}

function showHelp() {
  console.log(`
  \uD83E\uDDEC Repo Entropy Analyzer v${pkg.version}
  experimental entropy heuristics

  Scan a repository and generate a code entropy report.

  Usage:
    repo-entropy analyze <path>

  Commands:
    analyze <path>   Analyze the repository at <path>

  Options:
    --help           Show this help message
    --version, -v    Show version number

  Examples:
    repo-entropy analyze .
    repo-entropy analyze ./my-project
    npx repo-entropy analyze .
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(pkg.version);
    process.exit(0);
  }

  if (args[0] !== "analyze" || !args[1]) {
    console.error("Unknown command. Run `repo-entropy --help` for usage.\n");
    process.exit(1);
  }

  const rootDir = resolve(args[1]);

  if (!existsSync(rootDir)) {
    console.error(`Error: path "${rootDir}" does not exist.`);
    process.exit(1);
  }

  if (!statSync(rootDir).isDirectory()) {
    console.error(`Error: "${rootDir}" is not a directory.`);
    process.exit(1);
  }

  banner();

  const files = await scanFiles(rootDir);
  step(`scanned ${files.length} files`);

  if (files.length === 0) {
    console.log("\n  No analyzable files found.\n");
    return;
  }

  const longFiles: string[] = [];
  for (const file of files) {
    if (countLines(file) >= LINE_THRESHOLD) {
      longFiles.push(file);
    }
  }

  const findings: Finding[] = [];
  const project = createProject(files);
  step(`project loaded (${files.length} sources)`);

  const lfFindings = await longFile.analyze(files, project);
  findings.push(...lfFindings);
  step(`long files: ${lfFindings.length} issues`);

  const dcFindings = await deepComplexity.analyze(files, project);
  findings.push(...dcFindings);
  step(`deep nesting hotspots: ${dcFindings.length} issues`);

  if (longFiles.length > 0) {
    const deadFindings = await deadCode.analyze(longFiles, project, (i, total) => {
      process.stdout.write(`\r  [${i}/${total}] detecting dead code\u2026`);
    });
    process.stdout.write("\r\x1B[K");
    findings.push(...deadFindings);
    step(`dead code: ${deadFindings.length} issues`);

    const simFindings = await similarity.analyze(longFiles, project, (i, total) => {
      process.stdout.write(`\r  [${i}/${total}] finding duplicates\u2026`);
    });
    process.stdout.write("\r\x1B[K");
    findings.push(...simFindings);
    step(`duplicates: ${simFindings.length} issues`);
  } else {
    step("dead code: skipped (no long files)");
    step("duplicates: skipped (no long files)");
  }

  const report = buildReport(findings, files.length);
  const outputPath = resolve(rootDir, "entropy-report.md");
  generateMarkdown(report, outputPath, pkg.version);
  step("report generated");

  const icon = getStatusIcon(report.entropy);

  console.log();
  console.log(`  ${DIVIDER}`);
  console.log(`  Entropy Score: ${report.entropy} / 100`);
  console.log(`  Status: ${icon} ${report.status}`);
  console.log(`  ${DIVIDER}`);
  console.log();
  console.log(`  Report \u2192 entropy-report.md`);
  console.log();
  console.log(`  Next steps:`);
  console.log(`  \u2192 Open entropy-report.md for full details`);
  console.log(`  \u2192 Copy the AI Fix Prompt into your IDE to start fixing`);
  console.log(`  \u2192 Run periodically to track entropy over time`);
  console.log();
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message || err);
  process.exit(1);
});
