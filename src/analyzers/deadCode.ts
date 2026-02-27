import { Project, SourceFile, SyntaxKind } from "ts-morph";
import { Finding } from "../models/types";

export async function analyze(
  targetFiles: string[],
  fullProject: Project
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const targetSet = new Set(targetFiles.map((f) => f.replace(/\\/g, "/")));
  const sourceFiles = fullProject
    .getSourceFiles()
    .filter((sf) => targetSet.has(sf.getFilePath().replace(/\\/g, "/")));
  const allSourceFiles = fullProject.getSourceFiles();

  for (const sf of sourceFiles) {
    findings.push(...detectUnusedImports(sf));
    findings.push(...detectUnusedExports(sf, allSourceFiles));
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

function detectUnusedExports(
  sourceFile: SourceFile,
  allSourceFiles: SourceFile[]
): Finding[] {
  const findings: Finding[] = [];
  const filePath = sourceFile.getFilePath();

  for (const fn of sourceFile.getFunctions()) {
    if (!fn.isExported()) continue;
    const name = fn.getName();
    if (!name) continue;

    const usedInOtherFiles = allSourceFiles
      .filter((sf) => sf !== sourceFile)
      .some((sf) =>
        sf
          .getDescendantsOfKind(SyntaxKind.Identifier)
          .some((id) => id.getText() === name)
      );

    if (usedInOtherFiles) continue;

    const fnStart = fn.getStart();
    const fnEnd = fn.getEnd();
    const usedInSameFile = sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .some(
        (id) =>
          id.getText() === name &&
          (id.getStart() < fnStart || id.getStart() >= fnEnd)
      );

    if (!usedInSameFile) {
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
