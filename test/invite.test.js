"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createInteraction,
  createTextChannel,
  createUser,
  responseText,
} = require("./support/fakes.js");

const invite = require("../commands/utility/invite.js");

test("invite grants ViewChannel to every provided user and skips empty slots", async () => {
  const channel = createTextChannel();
  const alice = createUser({ id: "u-alice", username: "alice" });
  const carol = createUser({ id: "u-carol", username: "carol" });
  const interaction = createInteraction({
    optionValues: { channel, user1: alice, user3: carol }, // user2/4/5 omitted
  });
  await invite.execute(interaction);
  assert.deepEqual(
    channel.permissionOverwrites.edits,
    [
      ["u-alice", { ViewChannel: true }],
      ["u-carol", { ViewChannel: true }],
    ]
  );
  assert.equal(responseText(interaction), "Added alice, carol.");
  assert.equal(interaction.deferOptions.ephemeral, true);
});

test("invite deduplicates the same user passed in multiple slots", async () => {
  const channel = createTextChannel();
  const alice = createUser({ id: "u-alice", username: "alice" });
  const interaction = createInteraction({
    optionValues: { channel, user1: alice, user2: alice, user5: alice },
  });
  await invite.execute(interaction);
  assert.equal(channel.permissionOverwrites.edits.length, 1, "duplicate users must be granted once");
  assert.equal(responseText(interaction), "Added alice.");
});

test("invite reports a helpful error when the permission edit fails", async () => {
  const channel = createTextChannel({ overwriteError: new Error("Missing Permissions") });
  const interaction = createInteraction({
    optionValues: { channel, user1: createUser() },
  });
  await invite.execute(interaction);
  assert.equal(
    responseText(interaction),
    "I couldn't add all of those members. Check my channel permissions and try again."
  );
  assert.equal(interaction.edits.length, 1, "must produce exactly one follow-up");
});
