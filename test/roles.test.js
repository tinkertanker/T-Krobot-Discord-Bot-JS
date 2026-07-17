"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Collection } = require("discord.js");
const {
  createInteraction,
  createGuild,
  createMember,
  createRole,
  createUser,
} = require("./support/fakes.js");

const addRole = require("../commands/moderation/add-role.js");
const removeRole = require("../commands/moderation/remove-role.js");

function setup({ hasRole = false, roleAddError, roleRemoveError, cachePopulated = true } = {}) {
  const role = createRole({ id: "role-9", name: "Trainer" });
  const target = createUser({ id: "u-target", username: "target", tag: "target#0" });
  const roleCache = new Collection(hasRole ? [[role.id, role]] : []);
  const member = createMember({ id: target.id, roleCache, roleAddError, roleRemoveError });
  const members = new Collection();
  // members.fetch always resolves; the cache may independently be stale/empty.
  members.set(target.id, member);
  const guild = createGuild({ members });
  if (!cachePopulated) guild.members.cache = new Collection();
  const interaction = createInteraction({
    guild,
    optionValues: { user: target, role },
  });
  return { interaction, role, target, member };
}

function embedDescription(interaction) {
  const payload = interaction.replies[0] ?? interaction.edits[0];
  return payload.embeds[0].toJSON().description;
}

test("add-role adds the role and confirms ephemerally", async () => {
  const { interaction, member, role } = setup();
  await addRole.execute(interaction);
  assert.deepEqual(member.addedRoles, [role]);
  assert.equal(interaction.replies[0].ephemeral, true);
  assert.match(embedDescription(interaction), /added role `Trainer`/);
});

test("add-role does not re-add a role the member already has", async () => {
  const { interaction, member } = setup({ hasRole: true });
  await addRole.execute(interaction);
  assert.deepEqual(member.addedRoles, []);
  assert.match(embedDescription(interaction), /already has the role `Trainer`/);
});

test("add-role works even when the member is missing from the guild cache", async () => {
  // Regression: the command used guild.members.cache.get(...).roles after
  // fetching the member, which threw when the cache entry was absent.
  const { interaction, member, role } = setup({ cachePopulated: false });
  await addRole.execute(interaction);
  assert.deepEqual(member.addedRoles, [role]);
  assert.match(embedDescription(interaction), /added role `Trainer`/);
});

test("add-role reports failure via embed when the role grant is rejected", async () => {
  const { interaction, member } = setup({ roleAddError: new Error("Missing Permissions") });
  await addRole.execute(interaction);
  assert.deepEqual(member.addedRoles, []);
  assert.match(embedDescription(interaction), /Failed to add role `Trainer`/);
  assert.equal(interaction.replies.length, 1, "exactly one reply on failure");
});

test("remove-role removes the role and confirms ephemerally", async () => {
  const { interaction, member, role } = setup({ hasRole: true });
  await removeRole.execute(interaction);
  assert.deepEqual(member.removedRoles, [role]);
  assert.match(embedDescription(interaction), /removed role `Trainer`/);
});

test("remove-role refuses when the member does not have the role", async () => {
  const { interaction, member } = setup({ hasRole: false });
  await removeRole.execute(interaction);
  assert.deepEqual(member.removedRoles, []);
  assert.match(embedDescription(interaction), /doesn't have the role `Trainer`/);
});

test("remove-role works even when the member is missing from the guild cache", async () => {
  const { interaction, member, role } = setup({ hasRole: true, cachePopulated: false });
  await removeRole.execute(interaction);
  assert.deepEqual(member.removedRoles, [role]);
});

test("remove-role reports failure via embed when the role removal is rejected", async () => {
  const { interaction, member } = setup({ hasRole: true, roleRemoveError: new Error("nope") });
  await removeRole.execute(interaction);
  assert.deepEqual(member.removedRoles, []);
  assert.match(embedDescription(interaction), /Failed to remove role `Trainer`/);
});
