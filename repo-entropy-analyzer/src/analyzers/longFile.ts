import { Project } from "ts-morph";
import { Finding } from "../models/types";

export async function analyze(
  _files: string[],
  project: Project
): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const lineCount = sourceFile.getEndLineNumber();
    const filePath = sourceFile.getFilePath();

    if (lineCount > 1000) {
      findings.push({
        type: "long-file",
        file: filePath,
        message: `Critical: ${lineCount} lines`,
        score: 1.5,
      });
    } else if (lineCount > 500) {
      findings.push({
        type: "long-file",
        file: filePath,
        message: `Warning: ${lineCount} lines`,
        score: 1.5,
      });
    }
  }

  return findings;
}
