const { spawnSync } = require("child_process");
const { resolve } = require("path");

const frontendDir = resolve(__dirname, "..", "frontend");

// Frontend currently has no unit test framework configured.
// Use production build as a smoke test to validate compile/runtime wiring.
const result = spawnSync("npm", ["run", "build"], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (result.error) {
  console.error("[tests-scripts/frontend-test] Failed to run frontend smoke test:", result.error.message);
  process.exit(1);
}

process.exit(result.status || 0);
