import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const DEFAULT_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/*.generated.*",
];

export function loadIgnorePatterns(rootDir: string): string[] {
  const patterns = [...DEFAULT_IGNORE_PATTERNS];

  for (const name of [".ignore", ".gitignore"]) {
    const filePath = join(rootDir, name);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, "utf-8").split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      const glob = line.startsWith("/")
        ? `**${line}/**`
        : line.includes("/")
          ? `**/${line}/**`
          : `**/${line}/**`;

      if (!patterns.includes(glob)) {
        patterns.push(glob);
      }
    }

    console.log(`  Loaded ${name} (${lines.length} lines)`);
  }

  return patterns;
}
