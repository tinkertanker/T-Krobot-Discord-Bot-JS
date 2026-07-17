"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Collection } = require("discord.js");
const { createInteraction } = require("./support/fakes.js");

const interactionCreate = require("../events/interactionCreate.js");

function dispatchInteraction({ command, commandName = "testcmd", isChatInput = true } = {}) {
  const commands = new Collection();
  if (command) commands.set(commandName, command);
  const interaction = createInteraction({});
  interaction.isChatInputCommand = () => isChatInput;
  interaction.commandName = commandName;
  interaction.client = { commands };
  return interaction;
}

test("dispatcher runs the matching command", async () => {
  let ran = false;
  const interaction = dispatchInteraction({
    command: { async execute() { ran = true; } },
  });
  await interactionCreate.execute(interaction);
  assert.equal(ran, true);
});

test("dispatcher ignores non-chat-input interactions entirely", async () => {
  let ran = false;
  const interaction = dispatchInteraction({
    command: { async execute() { ran = true; } },
    isChatInput: false,
  });
  await interactionCreate.execute(interaction);
  assert.equal(ran, false);
  assert.equal(interaction.replies.length, 0);
});

test("dispatcher survives an unknown command without replying", async () => {
  const interaction = dispatchInteraction({ command: null });
  await interactionCreate.execute(interaction);
  assert.equal(interaction.replies.length, 0);
  assert.equal(interaction.edits.length, 0);
});

test("dispatcher replies with an error when a command throws before acknowledging", async () => {
  const interaction = dispatchInteraction({
    command: { async execute() { throw new Error("boom"); } },
  });
  await interactionCreate.execute(interaction);
  assert.equal(interaction.replies.length, 1);
  assert.match(interaction.replies[0].content, /Something went wrong/);
  assert.equal(interaction.replies[0].ephemeral, true);
});

test("dispatcher edits the deferred reply when a command throws after deferring", async () => {
  const interaction = dispatchInteraction({
    command: {
      async execute(i) {
        await i.deferReply({ ephemeral: true });
        throw new Error("boom after defer");
      },
    },
  });
  await interactionCreate.execute(interaction);
  // A second reply() would throw InteractionAlreadyReplied; the dispatcher
  // must use editReply for an already-acknowledged interaction.
  assert.equal(interaction.replies.length, 0);
  assert.equal(interaction.edits.length, 1);
  assert.match(interaction.edits[0].content, /Something went wrong/);
});

test("dispatcher swallows failures of the error report itself", async () => {
  const interaction = dispatchInteraction({
    command: { async execute() { throw new Error("boom"); } },
  });
  interaction.reply = async () => { throw new Error("Unknown interaction"); };
  await assert.doesNotReject(() => interactionCreate.execute(interaction));
});
