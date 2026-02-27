export interface Finding {
  type:
    | "dead-code"
    | "long-file"
    | "similar-code"
    | "deep-complexity";

  file: string;
  message: string;
  score: number;
}
