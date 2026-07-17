"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Collection } = require("discord.js");
const {
  createInteraction,
  createTextChannel,
  createMessage,
  createThread,
  createGuild,
  responseText,
} = require("./support/fakes.js");

const closeCall = require("../commands/utility/close-call.js");

function interactionFor(message, messageId = "cfi-1") {
  const channel = createTextChannel({ messages: { [messageId]: message } });
  return createInteraction({
    channel,
    optionValues: { "message-id": messageId },
  });
}

test("close-call clears reactions, marks ❌, and locks the thread", async () => {
  const thread = createThread({ locked: false });
  const message = createMessage({ hasThread: true, thread });
  const interaction = interactionFor(message);
  await closeCall.execute(interaction);
  assert.equal(message.reactionsRemoved, true);
  assert.deepEqual(message.reacted, ["❌"]);
  assert.deepEqual(thread.lockCalls, [[true, "The CFI is now closed."]]);
  assert.match(responseText(interaction), /now locked/);
});

test("close-call falls back to fetching the thread channel when not cached on the message", async () => {
  const thread = createThread();
  const guildChannels = new Collection([["cfi-1", thread]]);
  const guild = createGuild({ channels: guildChannels });
  const message = createMessage({ id: "cfi-1", hasThread: true, thread: null, guild });
  const interaction = interactionFor(message);
  await closeCall.execute(interaction);
  assert.deepEqual(thread.lockCalls, [[true, "The CFI is now closed."]]);
});

test("close-call closes a threadless CFI and says so", async () => {
  const message = createMessage({ hasThread: false });
  const interaction = interactionFor(message);
  await closeCall.execute(interaction);
  assert.deepEqual(message.reacted, ["❌"]);
  assert.match(responseText(interaction), /no thread on the message to lock/);
});

test("close-call reports failure for an unknown message id", async () => {
  const interaction = interactionFor(createMessage(), "some-other-id");
  interaction.options.getString = () => "1234567890"; // id that fetch rejects
  await closeCall.execute(interaction);
  assert.match(responseText(interaction), /couldn't find or close/);
});

test("close-call reports failure when reacting is forbidden", async () => {
  const message = createMessage({ reactError: new Error("Missing Permissions") });
  const interaction = interactionFor(message);
  await closeCall.execute(interaction);
  assert.match(responseText(interaction), /couldn't find or close/);
});
