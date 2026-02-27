import { Project, SyntaxKind, Node } from "ts-morph";
import { Finding } from "../models/types";

const NESTING_KINDS = new Set([
  SyntaxKind.IfStatement,
  SyntaxKind.ForStatement,
  SyntaxKind.ForInStatement,
  SyntaxKind.ForOfStatement,
  SyntaxKind.WhileStatement,
  SyntaxKind.DoStatement,
  SyntaxKind.SwitchStatement,
  SyntaxKind.TryStatement,
]);

export async function analyze(
  _files: string[],
  project: Project
): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath();

    for (const fn of sourceFile.getFunctions()) {
      const maxDepth = getMaxNestingDepth(fn, 0);
      if (maxDepth > 4) {
        findings.push({
          type: "deep-complexity",
          file: filePath,
          message: `Function "${fn.getName() || "anonymous"}" has nesting depth ${maxDepth}`,
          score: 2,
        });
      }
    }
  }

  return findings;
}

function getMaxNestingDepth(node: Node, depth: number): number {
  let max = depth;

  for (const child of node.getChildren()) {
    const newDepth = NESTING_KINDS.has(child.getKind())
      ? depth + 1
      : depth;
    const childMax = getMaxNestingDepth(child, newDepth);
    if (childMax > max) max = childMax;
  }

  return max;
}
