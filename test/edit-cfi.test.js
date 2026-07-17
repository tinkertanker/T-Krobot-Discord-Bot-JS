"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createInteraction,
  createTextChannel,
  createMessage,
  createThread,
  responseText,
} = require("./support/fakes.js");

const editCfi = require("../commands/utility/edit-cfi.js");

function cfiEmbed(overrides = {}) {
  return {
    title: "Python Class",
    description: "Bring laptops",
    url: "https://maps.example/venue",
    fields: [
      { name: "Where", value: "Jurong", inline: true },
      { name: "Who", value: "2 instructors", inline: true },
      { name: "When", value: "Mon 9am" },
      { name: "CFI Status", value: "✅: CFI is open • ❌: CFI has closed" },
    ],
    image: { url: "https://cdn.example/poster.png" },
    ...overrides,
  };
}

function interactionFor(message, extraOptions = {}) {
  const channel = createTextChannel({ messages: { "cfi-1": message } });
  return createInteraction({
    channel,
    optionValues: {
      messageid: "cfi-1",
      "unlock-thread": false,
      ...extraOptions,
    },
  });
}

function editedEmbed(message) {
  return message.edits[0].embeds[0].toJSON();
}

test("edit-cfi replaces only the provided fields and keeps the rest", async () => {
  const thread = createThread({ name: "CFI: Python Class" });
  const message = createMessage({ embeds: [cfiEmbed()], hasThread: true, thread });
  const interaction = interactionFor(message, { "new-location": "Tampines" });
  await editCfi.execute(interaction);
  const embed = editedEmbed(message);
  assert.equal(embed.fields[0].value, "Tampines");
  assert.equal(embed.fields[1].value, "2 instructors");
  assert.equal(embed.fields[2].value, "Mon 9am");
  assert.equal(embed.description, "Bring laptops");
  assert.equal(embed.fields[3].name, "CFI Status", "trailing fields must be preserved");
  assert.match(responseText(interaction), /Edited\./);
});

test("edit-cfi renames the thread when the title changes", async () => {
  const thread = createThread({ name: "CFI: Python Class" });
  const message = createMessage({ embeds: [cfiEmbed()], hasThread: true, thread });
  const interaction = interactionFor(message, { "new-title": "Scratch Class" });
  await editCfi.execute(interaction);
  assert.equal(thread.name, "CFI: Scratch Class");
  assert.match(responseText(interaction), /Thread name edited as well\./);
});

test("edit-cfi does not double-append the map-link suffix", async () => {
  const embedData = cfiEmbed({ title: "Python Class (Click here for map link)" });
  const message = createMessage({ embeds: [embedData], hasThread: false });
  const interaction = interactionFor(message);
  await editCfi.execute(interaction);
  assert.equal(editedEmbed(message).title, "Python Class (Click here for map link)");
});

test("edit-cfi unlocks a locked thread only when asked", async () => {
  const locked = createThread({ name: "CFI: X", locked: true });
  const message = createMessage({ embeds: [cfiEmbed()], hasThread: true, thread: locked });
  const interaction = interactionFor(message, { "unlock-thread": true });
  await editCfi.execute(interaction);
  assert.equal(locked.locked, false);
  assert.match(responseText(interaction), /Thread unlocked\./);

  const stillLocked = createThread({ name: "CFI: X", locked: true });
  const message2 = createMessage({ embeds: [cfiEmbed()], hasThread: true, thread: stillLocked });
  const interaction2 = interactionFor(message2, { "unlock-thread": false });
  await editCfi.execute(interaction2);
  assert.equal(stillLocked.locked, true, "must not unlock without the flag");
});

test("edit-cfi rejects a message with no embeds", async () => {
  const message = createMessage({ embeds: [] });
  const interaction = interactionFor(message);
  await editCfi.execute(interaction);
  assert.equal(responseText(interaction), "That message does not contain a CFI embed.");
  assert.deepEqual(message.edits, []);
});

test("edit-cfi rejects foreign embeds that lack the CFI shape", async () => {
  // Regression: an embed with fewer than 3 fields (or no title/description)
  // crashed on fields[2].value and surfaced a misleading "couldn't find" error.
  const malformed = [
    cfiEmbed({ fields: [] }),
    cfiEmbed({ fields: [{ name: "Only", value: "one" }] }),
    cfiEmbed({ title: null }),
    cfiEmbed({ description: null }),
  ];
  for (const embed of malformed) {
    const message = createMessage({ embeds: [embed] });
    const interaction = interactionFor(message);
    await editCfi.execute(interaction);
    assert.equal(
      responseText(interaction),
      "That message does not contain a CFI embed.",
      `embed ${JSON.stringify(embed).slice(0, 60)}... must be rejected cleanly`
    );
    assert.deepEqual(message.edits, [], "malformed embeds must never be edited");
  }
});

test("edit-cfi reports failure for an unknown message id", async () => {
  const channel = createTextChannel({ messages: {} });
  const interaction = createInteraction({
    channel,
    optionValues: { messageid: "nope", "unlock-thread": false },
  });
  await editCfi.execute(interaction);
  assert.match(responseText(interaction), /couldn't find or edit/);
});

test("edit-cfi reports failure when the message edit is rejected", async () => {
  const message = createMessage({ embeds: [cfiEmbed()], editError: new Error("Missing Permissions") });
  const interaction = interactionFor(message);
  await editCfi.execute(interaction);
  assert.match(responseText(interaction), /couldn't find or edit/);
});
