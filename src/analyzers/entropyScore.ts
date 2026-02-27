import { Finding } from "../models/types";

export function computeEntropy(findings: Finding[]): number {
  let dead = 0;
  let similar = 0;
  let longFiles = 0;
  let deepComplexity = 0;

  for (const f of findings) {
    switch (f.type) {
      case "dead-code":
        dead++;
        break;
      case "similar-code":
        similar++;
        break;
      case "long-file":
        longFiles++;
        break;
      case "deep-complexity":
        deepComplexity++;
        break;
    }
  }

  const raw =
    dead * 2 + similar * 3 + longFiles * 1.5 + deepComplexity * 2;

  return Math.min(100, Math.round(raw));
}
