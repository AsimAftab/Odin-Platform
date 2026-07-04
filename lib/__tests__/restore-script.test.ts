import { test, expect, describe } from "bun:test";
import { buildRestoreScript } from "@/lib/restore-script";

const snap = {
  machine: { hostname: "DEV-BOX" },
  capturedAt: "2026-07-01T12:00:00.000Z",
  packages: {
    packages: [
      { id: "Git.Git", name: "Git", version: "2.44.0", source: "winget" },
      { id: "ripgrep", name: "ripgrep", version: "14.0.0", source: "scoop" },
      { id: "SomeApp", name: "SomeApp", version: "1.0", source: "manual" },
    ],
  },
  vscode: { extensions: [{ identifier: "ms-python.python", version: "2024.6.0" }] },
  git: {
    entries: [
      { key: "user.name", value: "Ada Lovelace" },
      { key: "user.email", value: "ada@example.com" },
    ],
  },
  environment: {
    user_variables: [
      { name: "EDITOR", value: "code", scope: "user" },
      { name: "GITHUB_TOKEN", value: "ghp_" + "a".repeat(36), scope: "user" },
      { name: "PATH", value: "C:\\a;C:\\b", scope: "user" },
    ],
  },
};

describe("buildRestoreScript", () => {
  const script = buildRestoreScript(snap);

  test("includes a review header and the machine name", () => {
    expect(script).toContain("REVIEW THIS SCRIPT BEFORE RUNNING");
    expect(script).toContain("DEV-BOX");
  });

  test("emits per-manager install commands", () => {
    expect(script).toContain("winget install --id Git.Git -e");
    expect(script).toContain("scoop install ripgrep");
  });

  test("manual-source packages are commented, not executed", () => {
    expect(script).toContain("# (manual) SomeApp 1.0");
    expect(script).not.toContain("manual install SomeApp");
  });

  test("installs VS Code extensions and git config", () => {
    expect(script).toContain("code --install-extension ms-python.python");
    expect(script).toContain("git config --global 'user.name' 'Ada Lovelace'");
  });

  test("sets non-secret env vars but redacts secret-looking ones", () => {
    expect(script).toContain("setx EDITOR 'code'");
    expect(script).toContain("# setx GITHUB_TOKEN '<REDACTED");
    expect(script).not.toContain("ghp_aaaa");
  });

  test("excludes PATH-type variables", () => {
    expect(script).not.toContain("setx PATH");
  });

  test("does not throw on an empty snapshot", () => {
    expect(() => buildRestoreScript({})).not.toThrow();
  });
});
