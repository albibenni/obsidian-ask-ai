import { readFileSync, writeFileSync } from "node:fs";

const targetVersion = process.env.npm_package_version;

if (
  !targetVersion ||
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(targetVersion)
) {
  throw new Error("npm_package_version must contain a valid semantic version");
}

const manifest = readJson("manifest.json");
if (typeof manifest.minAppVersion !== "string") {
  throw new Error("manifest.json must contain a minAppVersion string");
}

manifest.version = targetVersion;
writeJson("manifest.json", manifest);

const versions = readJson("versions.json");
if (!(targetVersion in versions)) {
  versions[targetVersion] = manifest.minAppVersion;
  writeJson("versions.json", versions);
}

function readJson(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must contain a JSON object`);
  }
  return value;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
