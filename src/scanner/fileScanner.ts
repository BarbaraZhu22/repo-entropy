import fg from "fast-glob";
import { loadIgnorePatterns } from "./ignore";

export async function scanFiles(rootDir: string): Promise<string[]> {
  const ignorePatterns = loadIgnorePatterns(rootDir);

  return fg(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"], {
    cwd: rootDir,
    ignore: ignorePatterns,
    absolute: true,
  });
}
