"use strict";
const fs = require("node:fs");
const path = require("node:path");

// Several modules (notion.js, shorten.js, commands/moderation/verify.js) do
// `require("../../config.json")` at load time, but config.json is gitignored.
// Tests create a clearly-fake stub when no config exists, and only ever delete
// a config that carries the sentinel key, so a developer's real config.json is
// never touched.
const CONFIG_PATH = path.join(__dirname, "..", "..", "config.json");
const SENTINEL = "__generatedForTests";

const STUB = {
  [SENTINEL]: true,
  clientId: "100000000000000001",
  guildId: "100000000000000002",
  token: "test-token",
  notionKey: "test-notion-key",
  shortIoKey: "test-shortio-key",
  verificationChannel: "100000000000000003",
  trainerRole: "100000000000000004",
  tinkertankerRole: "100000000000000005",
  pmCategory: "100000000000000006",
};

function ensureConfig() {
  if (fs.existsSync(CONFIG_PATH)) return false;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(STUB, null, 2) + "\n");
  return true;
}

function cleanupConfig() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    if (parsed && parsed[SENTINEL] === true) fs.unlinkSync(CONFIG_PATH);
  } catch {
    // Missing or unreadable config: nothing to clean up.
  }
}

module.exports = { ensureConfig, cleanupConfig, CONFIG_PATH };
