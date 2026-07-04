import { test, expect, describe } from "bun:test";
import { parseTokenKeyId } from "@/lib/token-format";

describe("parseTokenKeyId", () => {
  test("extracts the 16-hex keyId from a keyed token", () => {
    const keyId = "0123456789abcdef";
    const secret = "a".repeat(64);
    expect(parseTokenKeyId(`odin_${keyId}_${secret}`)).toBe(keyId);
  });

  test("returns null for the old unkeyed shape (now rejected)", () => {
    expect(parseTokenKeyId(`odin_${"a".repeat(64)}`)).toBeNull();
  });

  test("returns null for malformed / wrong-length tokens", () => {
    expect(parseTokenKeyId("odin_short_" + "a".repeat(64))).toBeNull();
    expect(parseTokenKeyId("odin_0123456789abcdef_" + "a".repeat(32))).toBeNull();
    expect(parseTokenKeyId("not-a-token")).toBeNull();
    expect(parseTokenKeyId("odin_XYZ_" + "a".repeat(64))).toBeNull();
  });
});
