import { Finding } from "../models/types";
import { computeEntropy } from "../analyzers/entropyScore";

export interface Report {
  entropy: number;
  findings: Finding[];
}

export function buildReport(findings: Finding[]): Report {
  return {
    entropy: computeEntropy(findings),
    findings,
  };
}
