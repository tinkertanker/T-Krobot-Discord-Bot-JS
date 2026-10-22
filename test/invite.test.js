"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Collection, DiscordAPIError } = require("discord.js");
const {
  createInteraction,
  createTextChannel,
  createGuild,
  createUser,
  responseText,
} = require("./support/fakes.js");

function guildWith(channel) {
  return createGuild({ channels: new Collection([[channel.id, channel]]) });
}

const invite = require("../commands/utility/invite.js");

test("invite grants ViewChannel to every provided user and skips empty slots", async () => {
  const channel = createTextChannel();
  const alice = createUser({ id: "u-alice", username: "alice" });
  const carol = createUser({ id: "u-carol", username: "carol" });
  const interaction = createInteraction({
    optionValues: { channel, user1: alice, user3: carol }, // user2/4/5 omitted
    guild: guildWith(channel),
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
    guild: guildWith(channel),
  });
  await invite.execute(interaction);
  assert.equal(channel.permissionOverwrites.edits.length, 1, "duplicate users must be granted once");
  assert.equal(responseText(interaction), "Added alice.");
});

test("invite reports a helpful error when the permission edit fails", async () => {
  const channel = createTextChannel({ overwriteError: new Error("Missing Permissions") });
  const interaction = createInteraction({
    optionValues: { channel, user1: createUser() },
    guild: guildWith(channel),
  });
  await invite.execute(interaction);
  assert.equal(
    responseText(interaction),
    "I couldn't add all of those members. Check my channel permissions and try again."
  );
  assert.equal(interaction.edits.length, 1, "must produce exactly one follow-up");
});

test("invite fetches the channel when the option resolved to uncached data", async () => {
  // Discord returns a raw APIChannel (no .permissionOverwrites) when the
  // channel is not in the client cache; the command must fetch it instead.
  const channel = createTextChannel({ id: "chan-private" });
  const apiChannel = { id: channel.id };
  const interaction = createInteraction({
    optionValues: { channel: apiChannel, user1: createUser({ id: "u-alice" }) },
    guild: guildWith(channel),
  });
  await invite.execute(interaction);
  assert.deepEqual(channel.permissionOverwrites.edits, [["u-alice", { ViewChannel: true }]]);
});

test("invite reports a helpful error when the channel cannot be managed", async () => {
  const apiChannel = { id: "chan-invisible" };
  const interaction = createInteraction({
    optionValues: { channel: apiChannel, user1: createUser() },
    guild: createGuild(), // channel absent -> fetch resolves to null
  });
  await invite.execute(interaction);
  assert.equal(
    responseText(interaction),
    "I can't manage permissions on that channel. Pick a server text channel and try again."
  );
  assert.equal(interaction.edits.length, 1, "must produce exactly one follow-up");
});

test("invite reports the channel error when the fetch rejects with Unknown Channel", async () => {
  const apiChannel = { id: "chan-private" };
  const unknownChannel = new DiscordAPIError(
    { code: 10003, message: "Unknown Channel", errors: {} },
    10003, 404, "GET", "/channels/chan-private", {}
  );
  const interaction = createInteraction({
    optionValues: { channel: apiChannel, user1: createUser() },
    guild: createGuild({ channelFetchError: unknownChannel }),
  });
  await invite.execute(interaction);
  assert.equal(
    responseText(interaction),
    "I can't manage permissions on that channel. Pick a server text channel and try again."
  );
  assert.equal(interaction.edits.length, 1, "must produce exactly one follow-up");
});

test("invite reports the channel error when the fetch rejects with Missing Access", async () => {
  const apiChannel = { id: "chan-private" };
  const missingAccess = new DiscordAPIError(
    { code: 50001, message: "Missing Access", errors: {} },
    50001, 403, "GET", "/channels/chan-private", {}
  );
  const interaction = createInteraction({
    optionValues: { channel: apiChannel, user1: createUser() },
    guild: createGuild({ channelFetchError: missingAccess }),
  });
  await invite.execute(interaction);
  assert.equal(
    responseText(interaction),
    "I can't manage permissions on that channel. Pick a server text channel and try again."
  );
});

test("invite reports the generic error when the fetch fails for another reason", async () => {
  const apiChannel = { id: "chan-flaky" };
  const interaction = createInteraction({
    optionValues: { channel: apiChannel, user1: createUser() },
    guild: createGuild({ channelFetchError: new Error("socket hangup") }),
  });
  await invite.execute(interaction);
  assert.equal(
    responseText(interaction),
    "I couldn't add all of those members. Check my channel permissions and try again."
  );
});
