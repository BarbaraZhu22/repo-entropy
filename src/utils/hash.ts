import { createHash } from "crypto";

export function hashString(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

export function normalizeCode(code: string): string {
  return code
    .replace(/\s+/g, " ")
    .replace(/[a-zA-Z_$][a-zA-Z0-9_$]*/g, "_")
    .trim();
}
