import { Project, SourceFile, SyntaxKind } from "ts-morph";
import { Finding } from "../models/types";

export async function analyze(
  _files: string[],
  project: Project
): Promise<Finding[]> {
  const findings: Finding[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    findings.push(...detectUnusedImports(sourceFile));
    findings.push(...detectUnusedExports(sourceFile));
  }

  return findings;
}

function detectUnusedImports(sourceFile: SourceFile): Finding[] {
  const findings: Finding[] = [];
  const filePath = sourceFile.getFilePath();
  const fullText = sourceFile.getFullText();

  for (const imp of sourceFile.getImportDeclarations()) {
    const importStart = imp.getStart();
    const importEnd = imp.getEnd();
    const textBefore = fullText.slice(0, importStart);
    const textAfter = fullText.slice(importEnd);
    const bodyText = textBefore + textAfter;

    for (const named of imp.getNamedImports()) {
      const alias = named.getAliasNode()?.getText();
      const originalName = named.getName();
      const localName = alias ?? originalName;
      const pattern = new RegExp(`\\b${localName}\\b`);
      if (!pattern.test(bodyText)) {
        const label = alias
          ? `${originalName} (as ${alias})`
          : originalName;
        findings.push({
          type: "dead-code",
          file: filePath,
          message: `Unused import: ${label}`,
          score: 2,
        });
      }
    }
  }

  return findings;
}

function detectUnusedExports(sourceFile: SourceFile): Finding[] {
  const findings: Finding[] = [];
  const filePath = sourceFile.getFilePath();

  for (const fn of sourceFile.getFunctions()) {
    if (!fn.isExported()) continue;
    const name = fn.getName();
    if (!name) continue;

    const identifiers = sourceFile
      .getProject()
      .getSourceFiles()
      .filter((sf) => sf !== sourceFile)
      .flatMap((sf) =>
        sf.getDescendantsOfKind(SyntaxKind.Identifier)
      )
      .filter((id) => id.getText() === name);

    if (identifiers.length === 0) {
      findings.push({
        type: "dead-code",
        file: filePath,
        message: `Exported but unused function: ${name}`,
        score: 2,
      });
    }
  }

  return findings;
}
