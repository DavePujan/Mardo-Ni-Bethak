const { spawnSync } = require("child_process");
const { resolve } = require("path");

const backendDir = resolve(__dirname, "..", "backend");

const result = spawnSync("npm", ["test"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (result.error) {
  console.error("[tests-scripts/backend-test] Failed to run backend tests:", result.error.message);
  process.exit(1);
}

process.exit(result.status || 0);
