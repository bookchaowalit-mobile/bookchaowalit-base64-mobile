import { describe, expect, it } from "vitest";
import { convert, MAX_INPUT_CHARS } from "./base64";

describe("input size cap", () => {
  it("converts input right at the limit", () => {
    const result = convert("a".repeat(MAX_INPUT_CHARS), "encode");
    expect(result.ok).toBe(true);
  });
  it("rejects input over the limit with a readable error", () => {
    const result = convert("a".repeat(MAX_INPUT_CHARS + 1), "decode");
    expect(result).toEqual({ ok: false, error: "Input is longer than 100,000 characters" });
  });
});
