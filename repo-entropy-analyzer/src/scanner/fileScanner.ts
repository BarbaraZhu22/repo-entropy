import fg from "fast-glob";
import { loadIgnorePatterns } from "./ignore";

export async function scanFiles(rootDir: string): Promise<string[]> {
  console.log("Loading ignore patterns...");
  const ignorePatterns = loadIgnorePatterns(rootDir);
  console.log(`  Using ${ignorePatterns.length} ignore patterns`);

  return fg(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"], {
    cwd: rootDir,
    ignore: ignorePatterns,
    absolute: true,
  });
}
