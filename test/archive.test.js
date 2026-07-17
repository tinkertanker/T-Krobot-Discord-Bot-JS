"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Collection } = require("discord.js");
const {
  createInteraction,
  createTextChannel,
  createCategory,
  createGuild,
  responseText,
} = require("./support/fakes.js");

const archive = require("../commands/utility/archive.js");
const bulkArchive = require("../commands/utility/bulk-archive.js");
const deleteChannel = require("../commands/utility/deleteclass.js");

test("archive moves the channel into the category", async () => {
  const channel = createTextChannel({ id: "c1", name: "old-class" });
  const category = createCategory({ id: "cat-arch", name: "archived" });
  const interaction = createInteraction({
    optionValues: { channelname: channel, categoryname: category },
  });
  await archive.execute(interaction);
  assert.equal(channel.parentId, "cat-arch");
  assert.match(responseText(interaction), /Moved/);
});

test("archive reports an error when the move fails", async () => {
  const channel = createTextChannel({ setParentError: new Error("Missing Permissions") });
  const category = createCategory();
  const interaction = createInteraction({
    optionValues: { channelname: channel, categoryname: category },
  });
  await archive.execute(interaction);
  assert.equal(responseText(interaction), "An error occurred while moving the channel.");
});

function bulkSetup({ channels }) {
  const cache = new Collection(channels.map((c) => [c.id, c]));
  const guild = createGuild({ channels: cache });
  const category = createCategory({ id: "cat-target", name: "archive-2024" });
  cache.set(category.id, category);
  const interaction = createInteraction({
    guild,
    optionValues: { channelname: "class-", categoryname: category },
  });
  return { interaction, category };
}

test("bulk-archive moves exactly the channels matching the prefix", async () => {
  const match1 = createTextChannel({ id: "m1", name: "class-python" });
  const match2 = createTextChannel({ id: "m2", name: "class-scratch" });
  const other = createTextChannel({ id: "o1", name: "general" });
  const { interaction } = bulkSetup({ channels: [match1, match2, other] });
  await bulkArchive.execute(interaction);
  assert.equal(match1.parentId, "cat-target");
  assert.equal(match2.parentId, "cat-target");
  assert.equal(other.parentId, null);
  assert.match(responseText(interaction), /Moved 2 channels/);
});

test("bulk-archive skips categories whose names match the prefix", async () => {
  // Regression: a category matching the prefix used to be swept up, its
  // setParent call failed, and the user saw a bogus "could not be moved".
  const matchingCategory = createCategory({ id: "cat-x", name: "class-archive" });
  const match = createTextChannel({ id: "m1", name: "class-python" });
  const { interaction } = bulkSetup({ channels: [match, matchingCategory] });
  await bulkArchive.execute(interaction);
  assert.match(responseText(interaction), /Moved 1 channels with prefix/);
});

test("bulk-archive skips channels already inside the target category", async () => {
  const alreadyThere = createTextChannel({ id: "m1", name: "class-python", parentId: "cat-target" });
  const toMove = createTextChannel({ id: "m2", name: "class-scratch" });
  const { interaction } = bulkSetup({ channels: [alreadyThere, toMove] });
  const moves = [];
  alreadyThere.setParent = async () => moves.push("alreadyThere");
  await bulkArchive.execute(interaction);
  assert.deepEqual(moves, [], "channels already in the category must not be re-moved");
  assert.match(responseText(interaction), /Moved 1 channels with prefix/);
});

test("bulk-archive counts failures without aborting the batch", async () => {
  const ok = createTextChannel({ id: "m1", name: "class-a" });
  const broken = createTextChannel({ id: "m2", name: "class-b", setParentError: new Error("boom") });
  const ok2 = createTextChannel({ id: "m3", name: "class-c" });
  const { interaction } = bulkSetup({ channels: [ok, broken, ok2] });
  await bulkArchive.execute(interaction);
  assert.equal(ok.parentId, "cat-target");
  assert.equal(ok2.parentId, "cat-target");
  assert.match(responseText(interaction), /Moved 2 channels; 1 channels could not be moved/);
});

test("bulk-archive with no matching channels reports zero moves", async () => {
  const other = createTextChannel({ id: "o1", name: "general" });
  const { interaction } = bulkSetup({ channels: [other] });
  await bulkArchive.execute(interaction);
  assert.match(responseText(interaction), /Moved 0 channels/);
});

test("delete-channel deletes and confirms", async () => {
  const channel = createTextChannel({ id: "doomed" });
  const interaction = createInteraction({ optionValues: { channel } });
  await deleteChannel.execute(interaction);
  assert.equal(channel.deleted, true);
  assert.match(responseText(interaction), /has been deleted/);
});

test("delete-channel reports an error when deletion fails", async () => {
  const channel = createTextChannel({ deleteError: new Error("Missing Permissions") });
  const interaction = createInteraction({ optionValues: { channel } });
  await deleteChannel.execute(interaction);
  assert.equal(responseText(interaction), "An error occurred while deleting the channel.");
});
