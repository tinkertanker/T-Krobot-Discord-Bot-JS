"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createInteraction,
  createUser,
  createGuild,
  createMember,
  responseText,
} = require("./support/fakes.js");

const ping = require("../commands/fun/ping.js");
const avatar = require("../commands/utility/avatar.js");
const server = require("../commands/utility/server.js");
const userinfo = require("../commands/utility/userinfo.js");

test("ping replies exactly once with Pong!", async () => {
  const interaction = createInteraction();
  await ping.execute(interaction);
  assert.deepEqual(interaction.replies, ["Pong!"]);
});

test("avatar shows the target's avatar when one is given, else the caller's", async () => {
  const target = createUser({ id: "u-t", username: "target" });
  const withTarget = createInteraction({ optionValues: { target } });
  await avatar.execute(withTarget);
  assert.match(responseText(withTarget) ?? withTarget.replies[0], /^target's avatar: https:/);

  const caller = createUser({ id: "u-c", username: "caller" });
  const withoutTarget = createInteraction({ user: caller, optionValues: {} });
  await avatar.execute(withoutTarget);
  assert.match(withoutTarget.replies[0], /^Your avatar: https:/);
});

test("server reports the guild name and member count", async () => {
  const guild = createGuild({ name: "Tinkertanker", memberCount: 123 });
  const interaction = createInteraction({ guild });
  await server.execute(interaction);
  assert.equal(interaction.replies[0], "This server is Tinkertanker and has 123 members.");
});

test("user reports the caller's username and join date", async () => {
  const joinedAt = new Date("2023-05-01T00:00:00Z");
  const interaction = createInteraction({
    user: createUser({ username: "yj" }),
    member: createMember({ joinedAt }),
  });
  await userinfo.execute(interaction);
  assert.match(interaction.replies[0], /^This command was run by yj, who joined on /);
});
