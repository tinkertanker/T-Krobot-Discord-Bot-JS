"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createInteraction, createTextChannel, responseText } = require("./support/fakes.js");

const prune = require("../commands/moderation/prune.js");

const REJECTION = "You need to input a number between 1 and 99.";

test("prune rejects out-of-range and missing amounts without deleting anything", async () => {
  // null models the option being omitted entirely (it is not required).
  for (const amount of [null, 0, -1, 100, 1000, -2147483648]) {
    const interaction = createInteraction({ optionValues: { amount } });
    await prune.execute(interaction);
    assert.equal(responseText(interaction), REJECTION, `amount=${amount} should be rejected`);
    assert.equal(interaction.replies[0].ephemeral, true);
    assert.equal(interaction.channel.bulkDeleteCalls.length, 0, `amount=${amount} must not call bulkDelete`);
    assert.equal(interaction.deferred, false, "rejection should reply directly, not defer");
  }
});

test("prune accepts the boundary values 1 and 99 and filters old messages", async () => {
  for (const amount of [1, 99]) {
    const interaction = createInteraction({ optionValues: { amount } });
    await prune.execute(interaction);
    assert.deepEqual(interaction.channel.bulkDeleteCalls, [[amount, true]]);
    assert.equal(responseText(interaction), `Successfully pruned \`${amount}\` messages.`);
    assert.equal(interaction.deferOptions.ephemeral, true);
  }
});

test("prune reports the actual deleted count, not the requested amount", async () => {
  // bulkDelete(x, true) can delete fewer than requested (old messages skipped).
  const channel = createTextChannel({ bulkDeleteSize: 3 });
  const interaction = createInteraction({ optionValues: { amount: 50 }, channel });
  await prune.execute(interaction);
  assert.equal(responseText(interaction), "Successfully pruned `3` messages.");
});

test("prune reports an error instead of throwing when bulkDelete fails", async () => {
  const channel = createTextChannel({ bulkDeleteError: new Error("Missing Permissions") });
  const interaction = createInteraction({ optionValues: { amount: 10 }, channel });
  await prune.execute(interaction);
  assert.equal(
    responseText(interaction),
    "There was an error trying to prune messages in this channel!"
  );
});
