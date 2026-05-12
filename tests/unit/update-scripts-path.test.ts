import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const BUILD_DIR = resolve(ROOT, "scripts", "build");

function script(name: string): string {
  return readFileSync(resolve(BUILD_DIR, name), "utf-8");
}

describe("update scripts path resolution", () => {
  it("resolves repository root from scripts/build", () => {
    const scripts = readdirSync(BUILD_DIR).filter((name) => name.endsWith(".ts"));
    expect(scripts.length).toBeGreaterThan(0);
    for (const name of scripts) {
      expect(script(name), name).toContain('const ROOT = resolve(import.meta.dirname, "..", "..");');
    }
  });

  it("does not import root src utilities with a scripts-relative path", () => {
    const scripts = readdirSync(BUILD_DIR).filter((name) => name.endsWith(".ts"));
    for (const name of scripts) {
      expect(script(name), name).not.toContain('from "../src/');
    }
  });
});
