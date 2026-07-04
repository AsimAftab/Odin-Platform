import { test, expect, describe } from "bun:test";
import { isSecret, maskValue } from "@/lib/redact";

describe("isSecret — by name", () => {
  test("flags TOKEN/SECRET/PASSWORD/API_KEY names", () => {
    expect(isSecret("GITHUB_TOKEN", "anything")).toBe(true);
    expect(isSecret("MY_SECRET", "x")).toBe(true);
    expect(isSecret("DB_PASSWORD", "x")).toBe(true);
    expect(isSecret("OPENAI_API_KEY", "x")).toBe(true);
  });

  test("does not flag benign names with benign values", () => {
    expect(isSecret("EDITOR", "vim")).toBe(false);
    expect(isSecret("LANG", "en_US.UTF-8")).toBe(false);
  });
});

describe("isSecret — by value pattern", () => {
  test("flags GitHub PAT, OpenAI-style key, AWS key, JWT, PEM", () => {
    expect(isSecret("X", "ghp_" + "a".repeat(36))).toBe(true);
    expect(isSecret("X", "github_pat_" + "a".repeat(30))).toBe(true);
    expect(isSecret("X", "sk-" + "a".repeat(32))).toBe(true);
    expect(isSecret("X", "AKIAABCDEFGHIJKLMNOP")).toBe(true);
    expect(
      isSecret("X", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV")
    ).toBe(true);
    expect(isSecret("X", "-----BEGIN RSA PRIVATE KEY-----")).toBe(true);
  });

  test("does not flag ordinary values", () => {
    expect(isSecret("X", "hello world")).toBe(false);
    expect(isSecret("X", "C:\\Program Files\\Git")).toBe(false);
  });
});

describe("maskValue", () => {
  test("fully masks short values", () => {
    expect(maskValue("abc")).toBe("••••");
    expect(maskValue("12345678")).toBe("••••••••");
  });

  test("middle-masks long values keeping 3 + 3 ends", () => {
    const masked = maskValue("supersecretvalue123");
    expect(masked.startsWith("sup")).toBe(true);
    expect(masked.endsWith("123")).toBe(true);
    expect(masked).toContain("••••••");
  });

  test("empty stays empty", () => {
    expect(maskValue("")).toBe("");
  });
});
