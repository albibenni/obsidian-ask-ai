import { execFileSync } from "node:child_process";

const allowedReleaseTypes = new Set(["major", "minor", "patch"]);
const releaseType = parseReleaseType(process.argv.slice(2));

if (!allowedReleaseTypes.has(releaseType)) {
  console.error(
    `Invalid release type: ${releaseType}. Use major, minor, or patch.`,
  );
  process.exit(1);
}

console.log(`Validating and releasing a new ${releaseType} version...`);

try {
  run("pnpm", ["run", "check"]);
  run("pnpm", ["version", releaseType, "--tag-version-prefix="]);
  run("git", ["push", "--follow-tags"]);
  console.log(`Successfully released the ${releaseType} version.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Release failed: ${message}`);
  process.exit(1);
}

function parseReleaseType(args) {
  let releaseType = "patch";

  for (const argument of args) {
    if (argument.startsWith("type=")) {
      releaseType = argument.slice("type=".length);
    } else if (argument.startsWith("--type=")) {
      releaseType = argument.slice("--type=".length);
    } else {
      releaseType = argument;
    }
  }

  return releaseType;
}

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}
