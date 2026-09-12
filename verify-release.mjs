import { readFileSync } from "node:fs";

const packageJson = readJsonObject("package.json");
const manifest = readJsonObject("manifest.json");
const versions = readJsonObject("versions.json");
const expectedTag = process.argv[2];

const packageVersion = readRequiredString(
  packageJson,
  "version",
  "package.json",
);
const manifestVersion = readRequiredString(
  manifest,
  "version",
  "manifest.json",
);
const minimumAppVersion = readRequiredString(
  manifest,
  "minAppVersion",
  "manifest.json",
);

if (packageVersion !== manifestVersion) {
  throw new Error(
    `Version mismatch: package.json=${packageVersion}, manifest.json=${manifestVersion}`,
  );
}

if (versions[packageVersion] !== minimumAppVersion) {
  throw new Error(
    `versions.json must map ${packageVersion} to ${minimumAppVersion}`,
  );
}

if (expectedTag !== undefined && expectedTag !== packageVersion) {
  throw new Error(
    `Release tag ${expectedTag} does not match version ${packageVersion}`,
  );
}

console.log(`Release metadata is consistent for ${packageVersion}.`);

function readJsonObject(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must contain a JSON object`);
  }
  return value;
}

function readRequiredString(object, key, path) {
  const value = object[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path}.${key} must be a non-empty string`);
  }
  return value;
}
