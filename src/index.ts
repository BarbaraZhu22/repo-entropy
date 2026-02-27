#!/usr/bin/env node

import { resolve } from "path";
import { readFileSync, existsSync, statSync } from "fs";
import { scanFiles } from "./scanner/fileScanner";
import { createProject } from "./utils/ast";
import * as deadCode from "./analyzers/deadCode";
import * as longFile from "./analyzers/longFile";
import * as similarity from "./analyzers/similarity";
import * as deepComplexity from "./analyzers/deepComplexity";
import { buildReport } from "./report/reportBuilder";
import { generateMarkdown } from "./report/markdown";
import { Finding } from "./models/types";

const LINE_THRESHOLD = 200;

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "..", "package.json"), "utf-8")
);

function countLines(filePath: string): number {
  const content = readFileSync(filePath, "utf-8");
  return content.split("\n").length;
}

function progress(current: number, total: number, label: string) {
  const pct = Math.round((current / total) * 100);
  process.stdout.write(`\r  [${pct}%] ${current}/${total} ${label}`);
}

function showHelp() {
  console.log(`
  repo-entropy v${pkg.version}

  Scan a repository and generate a code entropy report.

  Usage:
    repo-entropy analyze <path>

  Commands:
    analyze <path>   Analyze the repository at <path> and generate entropy-report.md

  Options:
    --help           Show this help message
    --version, -v    Show version number

  Examples:
    repo-entropy analyze .
    repo-entropy analyze ./my-project
    npx repo-entropy-analyzer analyze .
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
  console.log(`Scanning: ${rootDir}\n`);

  const files = await scanFiles(rootDir);
  console.log(`\nFound ${files.length} files\n`);

  if (files.length === 0) {
    console.log("No files to analyze.");
    return;
  }

  console.log(`Checking file sizes (threshold: ${LINE_THRESHOLD} lines)...`);
  const longFiles: string[] = [];
  const shortFiles: string[] = [];

  for (let i = 0; i < files.length; i++) {
    progress(i + 1, files.length, "files checked");
    const lines = countLines(files[i]);
    if (lines >= LINE_THRESHOLD) {
      longFiles.push(files[i]);
    } else {
      shortFiles.push(files[i]);
    }
  }
  console.log(
    `\n  ${longFiles.length} long files (>= ${LINE_THRESHOLD} lines), ${shortFiles.length} short files\n`
  );

  const findings: Finding[] = [];

  console.log("Analyzing long files...");
  const allProject = createProject(files);
  findings.push(...(await longFile.analyze(files, allProject)));
  console.log(`  Found ${findings.length} long-file findings\n`);

  console.log("Analyzing deep complexity (all files)...");
  for (let i = 0; i < files.length; i++) {
    progress(i + 1, files.length, "files analyzed");
  }
  findings.push(...(await deepComplexity.analyze(files, allProject)));
  console.log(
    `\n  Found ${findings.filter((f) => f.type === "deep-complexity").length} complexity findings\n`
  );

  if (longFiles.length > 0) {
    console.log(
      `Analyzing dead code (${longFiles.length} long files, searching across all ${files.length} files)...`
    );
    const dcFindings = await deadCode.analyze(longFiles, allProject);
    findings.push(...dcFindings);
    console.log(
      `  Found ${dcFindings.length} dead-code findings\n`
    );

    console.log(
      `Analyzing similar code (${longFiles.length} long files only)...`
    );
    const simFindings = await similarity.analyze(longFiles, allProject);
    findings.push(...simFindings);
    console.log(`  Found ${simFindings.length} similarity findings\n`);
  } else {
    console.log("No long files — skipping dead code & similarity analysis\n");
  }

  const report = buildReport(findings);

  const outputPath = resolve(rootDir, "entropy-report.md");
  generateMarkdown(report, outputPath);

  console.log(`Entropy Score: ${report.entropy} / 100`);
  console.log(`Report generated: ${outputPath}`);
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message || err);
  process.exit(1);
});
