import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];
const verifierPath = fileURLToPath(
  new URL("../verify-release.mjs", import.meta.url),
);
const versionBumpPath = fileURLToPath(
  new URL("../version-bump.mjs", import.meta.url),
);

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("release metadata verification", () => {
  it("accepts matching package, manifest, versions, and tag values", () => {
    const directory = createReleaseFixture();
    const result = runVerifier(directory, "1.2.3");

    expect(result.status).toBe(0);
  });

  it("blocks a tag that does not match the packaged plugin", () => {
    const directory = createReleaseFixture();
    const result = runVerifier(directory, "9.9.9");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Release tag 9.9.9 does not match version 1.2.3",
    );
  });

  it("raises the minimum Obsidian version only for the next release", () => {
    const directory = createReleaseFixture();
    const result = spawnSync(process.execPath, [versionBumpPath], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, npm_package_version: "1.2.4" },
    });

    expect(result.status).toBe(0);
    expect(readJson(join(directory, "manifest.json"))).toMatchObject({
      version: "1.2.4",
      minAppVersion: "1.13.0",
    });
    expect(readJson(join(directory, "versions.json"))).toEqual({
      "1.2.3": "1.11.4",
      "1.2.4": "1.13.0",
    });
  });
});

function createReleaseFixture(): string {
  const directory = mkdtempSync(join(tmpdir(), "ask-ai-release-"));
  temporaryDirectories.push(directory);
  copyFileSync(verifierPath, join(directory, "verify-release.mjs"));
  writeJson(join(directory, "package.json"), { version: "1.2.3" });
  writeJson(join(directory, "manifest.json"), {
    version: "1.2.3",
    minAppVersion: "1.11.4",
  });
  writeJson(join(directory, "versions.json"), { "1.2.3": "1.11.4" });
  return directory;
}

function runVerifier(directory: string, tag: string) {
  return spawnSync(
    process.execPath,
    [join(directory, "verify-release.mjs"), tag],
    {
      cwd: directory,
      encoding: "utf8",
    },
  );
}

function writeJson(path: string, value: object): void {
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}
