"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PermissionFlagsBits } = require("discord.js");
require("./support/fakes.js"); // ensures config.json exists before commands load

const commandsRoot = path.join(__dirname, "..", "commands");
const commandFiles = [];
for (const folder of fs.readdirSync(commandsRoot)) {
  for (const file of fs.readdirSync(path.join(commandsRoot, folder))) {
    if (file.endsWith(".js")) {
      commandFiles.push({ folder, file, path: path.join(commandsRoot, folder, file) });
    }
  }
}
const commands = commandFiles.map((entry) => ({
  ...entry,
  module: require(entry.path),
}));

test("commands directory is not empty", () => {
  assert.ok(commands.length >= 18, `expected the full command set, found ${commands.length}`);
});

test("every command file exports data and an execute function", () => {
  for (const { path: filePath, module } of commands) {
    assert.ok("data" in module, `${filePath} is missing "data"`);
    assert.equal(typeof module.execute, "function", `${filePath} is missing "execute"`);
  }
});

test("every command serializes to valid application command JSON", () => {
  for (const { path: filePath, module } of commands) {
    const json = module.data.toJSON(); // throws if builder constraints are violated
    assert.match(json.name, /^[\p{Ll}\p{Lo}\p{N}_-]{1,32}$/u, `${filePath} has an invalid name`);
    assert.ok(json.description.length >= 1 && json.description.length <= 100,
      `${filePath} description length out of Discord's 1-100 range`);
    for (const option of json.options ?? []) {
      assert.ok(option.description.length >= 1 && option.description.length <= 100,
        `${filePath} option "${option.name}" description length out of range`);
    }
  }
});

test("command names are unique across all folders", () => {
  const seen = new Map();
  for (const { path: filePath, module } of commands) {
    const name = module.data.name;
    assert.ok(!seen.has(name), `duplicate command name "${name}" in ${filePath} and ${seen.get(name)}`);
    seen.set(name, filePath);
  }
});

test("required options are declared before optional options", () => {
  // Discord rejects registration otherwise; catches builder ordering mistakes.
  for (const { path: filePath, module } of commands) {
    const options = module.data.toJSON().options ?? [];
    let seenOptional = false;
    for (const option of options) {
      if (!option.required) seenOptional = true;
      else assert.ok(!seenOptional, `${filePath} declares required option "${option.name}" after an optional one`);
    }
  }
});

test("privileged commands declare the expected default member permissions", () => {
  const expected = {
    invite: PermissionFlagsBits.Administrator,
    prune: PermissionFlagsBits.ManageMessages,
    "add-role": PermissionFlagsBits.Administrator,
    "remove-role": PermissionFlagsBits.Administrator,
    "call-instructors": PermissionFlagsBits.Administrator,
    "close-call": PermissionFlagsBits.Administrator,
    "edit-cfi": PermissionFlagsBits.Administrator,
    create: PermissionFlagsBits.ManageChannels,
    notion: PermissionFlagsBits.ManageChannels,
    "delete-channel": PermissionFlagsBits.ManageChannels,
    archive: PermissionFlagsBits.ManageChannels,
    "bulk-archive": PermissionFlagsBits.ManageChannels,
    shorten: PermissionFlagsBits.ManageChannels,
  };
  const byName = new Map(commands.map((c) => [c.module.data.name, c]));
  for (const [name, permission] of Object.entries(expected)) {
    const command = byName.get(name);
    assert.ok(command, `expected command "${name}" to exist`);
    const declared = command.module.data.toJSON().default_member_permissions;
    assert.ok(declared != null, `"${name}" must declare default member permissions`);
    assert.equal(BigInt(declared), permission, `"${name}" has the wrong permission gate`);
  }
});

test("every mutating command is permission-gated (only known safe commands are open)", () => {
  // Commands intentionally usable by everyone. Anything new that mutates
  // state must be added to the expected-permissions table above instead.
  const openAllowlist = new Set(["ping", "avatar", "server", "user", "verify"]);
  for (const { path: filePath, module } of commands) {
    const json = module.data.toJSON();
    if (openAllowlist.has(json.name)) continue;
    assert.ok(json.default_member_permissions != null,
      `${filePath} ("${json.name}") mutates state but declares no default member permissions`);
  }
});

test("configTemplate.json documents every config key the code reads", () => {
  const template = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "configTemplate.json"), "utf8")
  );
  const usedKeys = [
    "clientId", "guildId", "token", // index.js / deploy-commands.js
    "notionKey", // notion.js
    "shortIoKey", // shorten.js
    "verificationChannel", "trainerRole", "tinkertankerRole", "pmCategory", // verify.js
  ];
  for (const key of usedKeys) {
    assert.ok(key in template, `configTemplate.json is missing "${key}"`);
  }
});
