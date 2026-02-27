import { Project } from "ts-morph";
import { Finding } from "../models/types";
import { hashString, normalizeCode } from "../utils/hash";

interface FunctionEntry {
  file: string;
  name: string;
}

export async function analyze(
  _files: string[],
  project: Project,
  onProgress?: (current: number, total: number) => void
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const hashMap = new Map<string, FunctionEntry[]>();
  const sourceFiles = project.getSourceFiles();

  for (let i = 0; i < sourceFiles.length; i++) {
    onProgress?.(i + 1, sourceFiles.length);
    const sourceFile = sourceFiles[i];
    const filePath = sourceFile.getFilePath();

    for (const fn of sourceFile.getFunctions()) {
      const body = fn.getBody()?.getText();
      if (!body || body.length < 50) continue;

      const hash = hashString(normalizeCode(body));
      const name = fn.getName() || "anonymous";

      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash)!.push({ file: filePath, name });
    }
  }

  for (const [, entries] of hashMap) {
    if (entries.length < 2) continue;

    const locations = entries
      .map((e) => `${e.name} in ${e.file}`)
      .join(", ");

    findings.push({
      type: "similar-code",
      file: entries[0].file,
      message: `Similar code detected across ${entries.length} functions: ${locations}`,
      score: 3,
    });
  }

  return findings;
}
