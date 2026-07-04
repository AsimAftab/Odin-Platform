import { test, expect, describe } from "bun:test";
import { diffSnapshots } from "@/lib/snapshot-diff";

const snapA = {
  packages: {
    packages: [
      { id: "Git.Git", name: "Git", version: "2.40.0", source: "winget" },
      { id: "old.tool", name: "OldTool", version: "1.0.0", source: "scoop" },
    ],
  },
  vscode: { extensions: [{ identifier: "ms-python.python", version: "2024.1.0" }] },
  environment: {
    user_variables: [
      { name: "EDITOR", value: "vim", scope: "user" },
      { name: "PATH", value: "C:\\a;C:\\b", scope: "user" },
    ],
  },
};

const snapB = {
  packages: {
    packages: [
      { id: "Git.Git", name: "Git", version: "2.44.0", source: "winget" }, // changed
      { id: "new.tool", name: "NewTool", version: "3.0.0", source: "scoop" }, // added
    ],
  },
  vscode: {
    extensions: [
      { identifier: "ms-python.python", version: "2024.6.0" }, // changed
      { identifier: "esbenp.prettier-vscode", version: "10.0.0" }, // added
    ],
  },
  environment: {
    user_variables: [
      { name: "EDITOR", value: "code", scope: "user" }, // changed
      { name: "PATH", value: "C:\\a;C:\\b;C:\\c", scope: "user" }, // excluded
    ],
  },
};

describe("diffSnapshots", () => {
  test("detects package add / remove / change", () => {
    const d = diffSnapshots(snapA, snapB);
    expect(d.packages.added.map((p) => p.name)).toEqual(["NewTool"]);
    expect(d.packages.removed.map((p) => p.name)).toEqual(["OldTool"]);
    expect(d.packages.changed).toHaveLength(1);
    expect(d.packages.changed[0]).toMatchObject({
      name: "Git",
      from: "2.40.0",
      to: "2.44.0",
    });
  });

  test("detects extension add and version change", () => {
    const d = diffSnapshots(snapA, snapB);
    expect(d.extensions.added.map((e) => e.name)).toEqual([
      "esbenp.prettier-vscode",
    ]);
    expect(d.extensions.changed[0]).toMatchObject({
      name: "ms-python.python",
      from: "2024.1.0",
      to: "2024.6.0",
    });
  });

  test("diffs env vars but excludes PATH-type variables", () => {
    const d = diffSnapshots(snapA, snapB);
    expect(d.environment.changed).toHaveLength(1);
    expect(d.environment.changed[0]).toMatchObject({
      name: "EDITOR",
      from: "vim",
      to: "code",
    });
    // PATH must not appear anywhere.
    const allNames = [
      ...d.environment.added,
      ...d.environment.removed,
      ...d.environment.changed,
    ].map((x) => x.name);
    expect(allNames).not.toContain("PATH");
  });

  test("identical snapshots report isEmpty", () => {
    expect(diffSnapshots(snapA, snapA).isEmpty).toBe(true);
    expect(diffSnapshots(snapA, snapB).isEmpty).toBe(false);
  });

  test("tolerates missing sections", () => {
    const d = diffSnapshots({}, snapB);
    expect(d.packages.added.length).toBe(2);
    expect(d.isEmpty).toBe(false);
    expect(() => diffSnapshots({}, {})).not.toThrow();
  });
});
