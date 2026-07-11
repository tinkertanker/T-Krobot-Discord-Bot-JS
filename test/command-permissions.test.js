const test = require("node:test");
const assert = require("node:assert/strict");
const { PermissionFlagsBits } = require("discord.js");

const invite = require("../commands/utility/invite.js");
const prune = require("../commands/moderation/prune.js");

function defaultPermissions(command) {
  return BigInt(command.data.toJSON().default_member_permissions);
}

test("invite is restricted to administrators", () => {
  assert.equal(defaultPermissions(invite), PermissionFlagsBits.Administrator);
});

test("prune is restricted to members who can manage messages", () => {
  assert.equal(defaultPermissions(prune), PermissionFlagsBits.ManageMessages);
});
