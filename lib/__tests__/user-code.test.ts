import { test, expect, describe } from "bun:test";
import { normalizeUserCode } from "@/lib/user-code";

describe("normalizeUserCode", () => {
  test("inserts the dash for an 8-char code", () => {
    expect(normalizeUserCode("WXYZ2345")).toBe("WXYZ-2345");
  });

  test("uppercases and strips spaces", () => {
    expect(normalizeUserCode("  wxyz2345 ")).toBe("WXYZ-2345");
  });

  test("accepts an already-dashed code", () => {
    expect(normalizeUserCode("wxyz-2345")).toBe("WXYZ-2345");
  });

  test("leaves malformed codes uppercased/trimmed (won't match)", () => {
    expect(normalizeUserCode("  abc ")).toBe("ABC");
  });
});
