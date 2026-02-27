import { writeFileSync } from "fs";
import { Report } from "./reportBuilder";
import { Finding } from "../models/types";

export function generateMarkdown(
  report: Report,
  outputPath: string
): void {
  const lines: string[] = [];

  lines.push("# Repo Entropy Report\n");
  lines.push("## Summary\n");
  lines.push(`Entropy Score: **${report.entropy} / 100**\n`);

  const sections: { title: string; type: Finding["type"] }[] = [
    { title: "Dead Code", type: "dead-code" },
    { title: "Long Files", type: "long-file" },
    { title: "Similar Code", type: "similar-code" },
    { title: "Deep Complexity", type: "deep-complexity" },
  ];

  for (const section of sections) {
    lines.push(`## ${section.title}\n`);
    const items = report.findings.filter(
      (f) => f.type === section.type
    );

    if (items.length === 0) {
      lines.push("No issues found.\n");
    } else {
      for (const item of items) {
        lines.push(`- **${item.file}**: ${item.message}`);
      }
      lines.push("");
    }
  }

  writeFileSync(outputPath, lines.join("\n"), "utf-8");
}
