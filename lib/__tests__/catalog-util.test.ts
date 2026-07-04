import { test, expect, describe } from "bun:test";
import { slugify, buildCommand } from "@/lib/catalog-util";

describe("slugify", () => {
  test("lowercases and hyphenates", () => {
    expect(slugify("Visual Studio Code")).toBe("visual-studio-code");
  });

  test("collapses non-alphanumerics and trims edges", () => {
    expect(slugify("  Node.js!! ")).toBe("node-js");
  });
});

describe("buildCommand", () => {
  test("winget uses -e, pins --source winget, and agreement flags", () => {
    expect(buildCommand("winget", "Git.Git")).toBe(
      "winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements"
    );
  });

  test("chocolatey installs with -y", () => {
    expect(buildCommand("chocolatey", "git")).toBe("choco install git -y");
  });

  test("scoop / npm / pip / cargo shapes", () => {
    expect(buildCommand("scoop", "git")).toBe("scoop install git");
    expect(buildCommand("npm", "typescript")).toBe("npm install -g typescript");
    expect(buildCommand("pip", "black")).toBe("pip install black");
    expect(buildCommand("cargo", "ripgrep")).toBe("cargo install ripgrep");
  });

  test("manual and unknown managers pass the id through verbatim", () => {
    expect(buildCommand("manual", "https://example.com/installer.exe")).toBe(
      "https://example.com/installer.exe"
    );
    expect(buildCommand("something-else", "foo")).toBe("foo");
  });

  test("trims the package id", () => {
    expect(buildCommand("scoop", "  git  ")).toBe("scoop install git");
  });
});
