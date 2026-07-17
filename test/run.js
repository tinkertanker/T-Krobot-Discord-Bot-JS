"use strict";
// Entry point for `npm test`. Creates a stub config.json when none exists
// (several modules require it at load time), runs every test file, then
// removes the stub so no fake credentials linger in the working tree.

// Never recurse if the node test runner picks this file up as a test file.
if (process.env.NODE_TEST_CONTEXT || process.env.TKROBOT_TEST_RUNNER) {
  process.exit(0);
}

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { ensureConfig, cleanupConfig } = require("./support/config-stub.js");

const testDir = __dirname;
const testFiles = fs
  .readdirSync(testDir)
  .filter((file) => file.endsWith(".test.js"))
  .sort()
  .map((file) => path.join(testDir, file));

const createdStub = ensureConfig();
const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
  env: { ...process.env, TKROBOT_TEST_RUNNER: "1" },
});
if (createdStub) cleanupConfig();
process.exit(result.status ?? 1);
