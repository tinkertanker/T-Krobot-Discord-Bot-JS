"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { ChannelType } = require("discord.js");
const {
  createInteraction,
  createGuild,
  createCategory,
  createRole,
  responseText,
} = require("./support/fakes.js");

const createClass = require("../commands/utility/createclass.js");
const createNotion = require("../commands/utility/createnotion.js");

function classInteraction(channeltype, { notionBody = { url: "https://notion.so/p" }, notionError, guildOverrides = {} } = {}) {
  const guild = createGuild(guildOverrides);
  const interaction = createInteraction({
    guild,
    optionValues: {
      channeltype,
      channelname: "python class",
      parent: createCategory({ id: "cat-classes", name: "classes" }),
      "permission-role": createRole({ id: "role-class" }),
    },
  });
  return { interaction, guild, notionBody, notionError };
}

function mockNotionFetch(t, body, error) {
  t.mock.method(globalThis, "fetch", async () => {
    if (error) throw error;
    return { json: async () => body };
  });
}

test("create text channel builds channel, role, and Notion page", async (t) => {
  const { interaction, guild } = classInteraction("textchannel");
  mockNotionFetch(t, { url: "https://notion.so/p" });
  await createClass.execute(interaction);

  assert.equal(guild.createdChannels.length, 1);
  const channel = guild.createdChannels[0];
  assert.equal(channel.createOptions.type, ChannelType.GuildText);
  assert.equal(channel.createOptions.parent.id, "cat-classes");
  const overwrites = channel.createOptions.permissionOverwrites;
  assert.equal(overwrites[0].id.id, "role-class");
  assert.equal(overwrites[1].id, guild.roles.everyone.id, "@everyone must be denied view");

  assert.equal(guild.createdRoles.length, 1);
  assert.equal(guild.createdRoles[0].name, "python-class", "role name must be dash-joined");

  assert.ok(channel.sent.some((p) => typeof p === "string" && p.includes("notion.so/p")),
    "the Notion link must be posted into the new channel");
  assert.equal(responseText(interaction), "The text channel, role, and Notion page have been created.");
});

test("create text channel still succeeds when the Notion call fails", async (t) => {
  const { interaction, guild } = classInteraction("textchannel");
  mockNotionFetch(t, null, new Error("notion down"));
  await createClass.execute(interaction);
  assert.equal(guild.createdChannels.length, 1);
  assert.equal(guild.createdRoles.length, 1);
  assert.equal(
    responseText(interaction),
    "The text channel and role were created, but the Notion page could not be created."
  );
});

test("create text channel handles a null Notion response body", async (t) => {
  // Adversarial: res.json() can resolve to null; page.url must not crash.
  const { interaction } = classInteraction("textchannel");
  mockNotionFetch(t, null);
  await createClass.execute(interaction);
  assert.match(responseText(interaction), /Notion page could not be created/);
});

test("create voice channel builds channel and role without Notion", async (t) => {
  const { interaction, guild } = classInteraction("voicechannel");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return { json: async () => ({}) };
  });
  await createClass.execute(interaction);
  assert.equal(guild.createdChannels[0].createOptions.type, ChannelType.GuildVoice);
  assert.equal(calls.length, 0, "voice channel creation must not call Notion");
  assert.equal(responseText(interaction), "The voice channel and role have been created.");
});

test("create reports failure when channel creation is rejected", async (t) => {
  const { interaction } = classInteraction("textchannel", {
    guildOverrides: { channelCreateError: new Error("Missing Permissions") },
  });
  mockNotionFetch(t, {});
  await createClass.execute(interaction);
  assert.match(responseText(interaction), /could not be fully created/);
});

test("notion command replies with the page URL on success", async (t) => {
  mockNotionFetch(t, { url: "https://notion.so/created" });
  const interaction = createInteraction({
    optionValues: { notionname: "Page", description: "info" },
  });
  await createNotion.execute(interaction);
  assert.equal(responseText(interaction), "The notion has been created at https://notion.so/created");
});

test("notion command reports failure on error responses, null bodies, and network errors", async (t) => {
  const failures = [
    () => mockNotionFetch(t, { error: "unauthorized" }),
    () => mockNotionFetch(t, {}), // no url in response
    () => mockNotionFetch(t, null), // null body
    () => mockNotionFetch(t, null, new Error("ECONNRESET")),
  ];
  for (const arm of failures) {
    arm();
    const interaction = createInteraction({
      optionValues: { notionname: "Page", description: "info" },
    });
    await createNotion.execute(interaction);
    assert.equal(
      responseText(interaction),
      "The Notion page could not be created. Please try again later."
    );
  }
});
