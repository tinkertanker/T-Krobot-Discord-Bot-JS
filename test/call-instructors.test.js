"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createInteraction, createTextChannel, responseText } = require("./support/fakes.js");

const callInstructors = require("../commands/utility/call-instructors.js");

const BASE_OPTIONS = {
  title: "Python Class",
  when: "Mon 9am",
  where: "Jurong",
  who: "2 instructors",
  what: "Bring laptops",
};

function interactionFor(extra = {}, channelOverrides = {}) {
  const channel = createTextChannel(channelOverrides);
  const interaction = createInteraction({
    channel,
    optionValues: { ...BASE_OPTIONS, ...extra },
  });
  return { interaction, channel };
}

function sentEmbed(channel) {
  return channel.sent[0].embeds[0].toJSON();
}

test("call-instructors posts the CFI embed, starts a thread, and reacts", async () => {
  const { interaction, channel } = interactionFor();
  await callInstructors.execute(interaction);
  const embed = sentEmbed(channel);
  assert.equal(embed.title, "Python Class");
  assert.equal(embed.description, "Bring laptops");
  assert.deepEqual(
    embed.fields.map((f) => [f.name, f.value]),
    [
      ["Where", "Jurong"],
      ["Who", "2 instructors"],
      ["When", "Mon 9am"],
      ["CFI Status", "✅: CFI is open • ❌: CFI has closed"],
    ]
  );
  const message = channel.sentMessages[0];
  assert.equal(message.startedThread.name, "CFI: Python Class");
  assert.deepEqual(message.reacted, ["✅"]);
  assert.equal(responseText(interaction), "Your thread has been successfully created");
});

test("call-instructors converts literal \\n sequences into real newlines", async () => {
  const { interaction, channel } = interactionFor({ when: "Mon\\nTue", title: "A\\nB" });
  await callInstructors.execute(interaction);
  const embed = sentEmbed(channel);
  assert.equal(embed.fields[2].value, "Mon\nTue");
  assert.equal(embed.title, "A\nB");
});

test("call-instructors links the embed when an https link is provided", async () => {
  const { interaction, channel } = interactionFor({ link: "https://maps.example/venue" });
  await callInstructors.execute(interaction);
  const embed = sentEmbed(channel);
  assert.equal(embed.url, "https://maps.example/venue");
  assert.equal(embed.title, "Python Class (Click here for map link)");
});

test("call-instructors leaves the embed unlinked when no link is provided", async () => {
  const { interaction, channel } = interactionFor();
  await callInstructors.execute(interaction);
  const embed = sentEmbed(channel);
  assert.equal(embed.url, undefined);
  assert.equal(embed.title, "Python Class");
});

test("call-instructors rejects an invalid link instead of crashing mid-command", async () => {
  // Regression: EmbedBuilder.setURL threw on non-URL strings after the reply
  // was already deferred, so the user got a generic dispatcher error.
  for (const bad of ["www.example.com", "not a link", "javascript:alert(1)"]) {
    const { interaction, channel } = interactionFor({ link: bad });
    await callInstructors.execute(interaction);
    assert.equal(channel.sent.length, 0, `"${bad}" must not produce a CFI post`);
    assert.match(responseText(interaction), /valid HTTP or HTTPS/i);
  }
});

test("call-instructors uses the uploaded image when an attachment is provided", async () => {
  const { interaction, channel } = interactionFor({
    image: { url: "https://cdn.example/poster.png" },
  });
  await callInstructors.execute(interaction);
  assert.equal(sentEmbed(channel).image.url, "https://cdn.example/poster.png");
});

test("call-instructors falls back to the default image without an attachment", async () => {
  const { interaction, channel } = interactionFor();
  await callInstructors.execute(interaction);
  assert.match(sentEmbed(channel).image.url, /^https:\/\/tinkertanker\.com\//);
});

test("call-instructors fails cleanly when it has no channel to post in", async () => {
  // Regression: interaction.channel ?? "Not a text channel" then
  // channel.send(...) threw TypeError on the string fallback.
  const interaction = createInteraction({
    channel: null,
    optionValues: BASE_OPTIONS,
  });
  await callInstructors.execute(interaction);
  assert.match(responseText(interaction), /text channel/i);
});

test("call-instructors reports thread-creation failure after posting", async () => {
  const { interaction, channel } = interactionFor({}, {});
  channel.send = async () => {
    const message = require("./support/fakes.js").createMessage({
      startThreadError: new Error("Missing SEND_MESSAGES_IN_THREADS"),
    });
    channel.sent.push("embed");
    return message;
  };
  await callInstructors.execute(interaction);
  assert.equal(
    responseText(interaction),
    "An error occurred while creating the accompanying thread."
  );
});
