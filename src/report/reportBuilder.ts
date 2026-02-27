import { Finding } from "../models/types";
import { computeEntropy } from "../analyzers/entropyScore";

export interface ReportSummary {
  totalFiles: number;
  deadCode: number;
  longFiles: number;
  similarCode: number;
  deepComplexity: number;
}

export interface Report {
  entropy: number;
  status: string;
  findings: Finding[];
  summary: ReportSummary;
}

export function getStatus(score: number): string {
  if (score <= 20) return "Healthy";
  if (score <= 40) return "Low Entropy";
  if (score <= 60) return "Moderate Entropy";
  if (score <= 80) return "Growing Complexity";
  return "Critical Entropy";
}

export function getStatusIcon(score: number): string {
  if (score <= 20) return "\u2705";
  if (score <= 40) return "\uD83D\uDFE2";
  if (score <= 60) return "\u26A0\uFE0F";
  if (score <= 80) return "\uD83D\uDD36";
  return "\uD83D\uDD34";
}

export function buildReport(
  findings: Finding[],
  totalFiles: number
): Report {
  const entropy = computeEntropy(findings);

  const summary: ReportSummary = {
    totalFiles,
    deadCode: findings.filter((f) => f.type === "dead-code").length,
    longFiles: findings.filter((f) => f.type === "long-file").length,
    similarCode: findings.filter((f) => f.type === "similar-code").length,
    deepComplexity: findings.filter((f) => f.type === "deep-complexity").length,
  };

  return {
    entropy,
    status: getStatus(entropy),
    findings,
    summary,
  };
}
