"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { Collection, ChannelType } = require("discord.js");
const {
  createInteraction,
  createTextChannel,
  createCategory,
  createGuild,
  createMember,
  createUser,
  responseText,
} = require("./support/fakes.js");

const verify = require("../commands/moderation/verify.js");
const {
  verificationChannel,
  trainerRole,
  tinkertankerRole,
  pmCategory,
} = require("../config.json");

// verify.js keeps a module-level pending map keyed by `${guild.id}:${user.id}`,
// so every test gets a unique guild/user to stay isolated.
let uniqueCounter = 0;

function setup(overrides = {}) {
  uniqueCounter += 1;
  const user = createUser({
    id: `verify-user-${uniqueCounter}`,
    username: `newbie${uniqueCounter}`,
    dmError: overrides.dmError,
  });
  const member = createMember({
    id: user.id,
    roleAddError: overrides.roleAddError,
    nicknameError: overrides.nicknameError,
  });
  const members = new Collection([[user.id, member]]);
  const guild = createGuild({
    id: `verify-guild-${uniqueCounter}`,
    channels: overrides.guildChannels ?? new Collection(),
    members,
    memberFetchError: overrides.memberFetchError,
  });
  const vChannel =
    "vChannel" in overrides ? overrides.vChannel : createTextChannel({ id: verificationChannel });
  const client = {
    channels: {
      cache: new Collection(vChannel ? [[verificationChannel, vChannel]] : []),
    },
  };
  const interaction = createInteraction({
    user,
    guild,
    client,
    optionValues: { name: overrides.name ?? "John Doe" },
  });
  return { interaction, user, member, guild, vChannel, client };
}

function adminButton(customId) {
  const button = {
    customId,
    deferUpdated: false,
    edits: [],
    memberPermissions: { has: () => true },
    isButton: () => true,
    async deferUpdate() {
      button.deferUpdated = true;
    },
    async editReply(payload) {
      button.edits.push(payload);
      return payload;
    },
  };
  return button;
}

async function requestVerification(overrides = {}) {
  const context = setup(overrides);
  await verify.execute(context.interaction);
  context.request = context.vChannel?.sentMessages[0] ?? null;
  context.collector = context.request?.collector ?? null;
  return context;
}

test("verify posts a request with three admin buttons and tells the user to wait", async () => {
  const { interaction, vChannel, user, collector } = await requestVerification();
  assert.equal(responseText(interaction), "Wait for a while, we are verifying you");
  assert.equal(interaction.deferOptions.ephemeral, true);
  const payload = vChannel.sent[0];
  assert.equal(payload.content, `${user} joined.`);
  const buttons = payload.components[0].components.map((b) => b.toJSON());
  assert.deepEqual(buttons.map((b) => b.custom_id), ["newtrainer", "newtinkertanker", "newreject"]);
  assert.equal(collector.options.time, 604800000, "requests must expire after 7 days");
});

test("verify's collector filter only admits members with Administrator", async () => {
  const { collector } = await requestVerification();
  const { filter } = collector.options;
  assert.ok(filter({ memberPermissions: { has: () => true } }));
  assert.ok(!filter({ memberPermissions: { has: () => false } }));
  // memberPermissions is null for interactions outside a guild
  assert.ok(!filter({ memberPermissions: null }));
});

test("verify refuses when the verification channel is missing or not text-based", async () => {
  const missing = await requestVerification({ vChannel: null });
  assert.match(responseText(missing.interaction), /not configured correctly/);

  const notText = await requestVerification({
    vChannel: createTextChannel({ id: verificationChannel, textBased: false }),
  });
  assert.match(responseText(notText.interaction), /not configured correctly/);
});

test("verify blocks a second request while one is pending, then allows after expiry", async () => {
  const first = await requestVerification();
  assert.equal(first.vChannel.sent.length, 1);

  // Same guild+user tries again while the first request is pending.
  const again = createInteraction({
    user: first.user,
    guild: first.guild,
    client: first.client,
    optionValues: { name: "John Doe" },
  });
  await verify.execute(again);
  assert.match(responseText(again), /already have a verification request/);
  assert.equal(first.vChannel.sent.length, 1, "no duplicate request may be posted");

  // The collector expiring must clear the pending state and disable the message.
  await first.collector.stop("time");
  assert.equal(first.request.edits.length, 1);
  assert.match(first.request.edits[0].content, /verification request expired/);
  assert.deepEqual(first.request.edits[0].components, []);

  const retry = createInteraction({
    user: first.user,
    guild: first.guild,
    client: first.client,
    optionValues: { name: "John Doe" },
  });
  await verify.execute(retry);
  assert.equal(responseText(retry), "Wait for a while, we are verifying you");
  assert.equal(first.vChannel.sent.length, 2, "a fresh request must be allowed after expiry");
});

test("verify clears pending state when posting the request fails", async () => {
  const broken = createTextChannel({ id: verificationChannel, sendError: new Error("Missing Access") });
  const context = setup({ vChannel: broken });
  await assert.rejects(() => verify.execute(context.interaction), /Missing Access/);

  // The failure must not leave the user permanently stuck as "pending".
  const workingChannel = createTextChannel({ id: verificationChannel });
  const retry = createInteraction({
    user: context.user,
    guild: context.guild,
    client: { channels: { cache: new Collection([[verificationChannel, workingChannel]]) } },
    optionValues: { name: "John Doe" },
  });
  await verify.execute(retry);
  assert.equal(responseText(retry), "Wait for a while, we are verifying you");
  assert.equal(workingChannel.sent.length, 1);
});

test("approving as Trainer sets nickname, role, DM, and a private channel", async () => {
  const { collector, member, user, guild } = await requestVerification();
  const button = adminButton("newtrainer");
  await collector.emitCollect(button);

  assert.equal(member.nickname, "John Doe");
  assert.deepEqual(member.addedRoles, [trainerRole]);
  assert.deepEqual(user.dms, ["You are now verified"]);

  const category = guild.createdChannels.find((c) => c.type === ChannelType.GuildCategory);
  assert.equal(category.name, "private-messages", "a category is created when none exists");
  const personal = guild.createdChannels.find((c) => c.type !== ChannelType.GuildCategory);
  assert.equal(personal.createOptions.name, "john-doe");
  assert.equal(personal.createOptions.parent, category);
  const overwrites = personal.createOptions.permissionOverwrites;
  assert.equal(overwrites[0].id, user.id);
  assert.equal(overwrites[1].id, guild.roles.everyone.id);
  assert.equal(personal.sent.length, 3, "welcome + two info messages");
  assert.match(button.edits[0].content, /now verified with Trainer role/);
  assert.deepEqual(button.edits[0].components, [], "buttons must be removed once handled");
});

test("approving as Tinkertanker assigns the tinkertanker role", async () => {
  const { collector, member } = await requestVerification();
  await collector.emitCollect(adminButton("newtinkertanker"));
  assert.deepEqual(member.addedRoles, [tinkertankerRole]);
});

test("a second button click cannot double-process the same request", async () => {
  const { collector, member, guild } = await requestVerification();
  const first = adminButton("newtrainer");
  const second = adminButton("newtinkertanker");
  await collector.emitCollect(first);
  await collector.emitCollect(second);
  assert.deepEqual(member.addedRoles, [trainerRole], "only the first click may assign a role");
  assert.equal(
    guild.createdChannels.filter((c) => c.type !== ChannelType.GuildCategory).length,
    1,
    "only one personal channel may be created"
  );
  assert.equal(second.edits.length, 0, "the losing click must be ignored");
});

test("handling a request clears pending state so the user could re-verify later", async () => {
  const context = await requestVerification();
  await context.collector.emitCollect(adminButton("newreject"));
  const retry = createInteraction({
    user: context.user,
    guild: context.guild,
    client: context.client,
    optionValues: { name: "John Doe" },
  });
  await verify.execute(retry);
  assert.equal(responseText(retry), "Wait for a while, we are verifying you");
});

test("rejecting notifies the admins and DMs the user", async () => {
  const { collector, user, member } = await requestVerification();
  const button = adminButton("newreject");
  await collector.emitCollect(button);
  assert.match(button.edits[0].content, /was rejected/);
  assert.deepEqual(user.dms, ["Try again, or contact an admin."]);
  assert.deepEqual(member.addedRoles, [], "rejection must not assign roles");
});

test("rejecting a user whose DMs are closed does not crash", async () => {
  const { collector } = await requestVerification({ dmError: new Error("Cannot send messages to this user") });
  const button = adminButton("newreject");
  await collector.emitCollect(button);
  assert.match(button.edits[0].content, /was rejected/);
});

test("verification survives the verified user having DMs closed", async () => {
  const { collector, member } = await requestVerification({ dmError: new Error("Cannot send messages to this user") });
  const button = adminButton("newtrainer");
  await collector.emitCollect(button);
  assert.deepEqual(member.addedRoles, [trainerRole]);
  assert.match(button.edits[0].content, /now verified with Trainer role/);
});

test("a personal channel name collision gets a random suffix instead of a duplicate", async () => {
  const guildChannels = new Collection();
  const existing = createTextChannel({ id: "existing", name: "john-doe" });
  guildChannels.set(existing.id, existing);
  const { collector, guild } = await requestVerification({ guildChannels });
  await collector.emitCollect(adminButton("newtrainer"));
  const personal = guild.createdChannels.find((c) => c.type !== ChannelType.GuildCategory);
  assert.notEqual(personal.createOptions.name, "john-doe");
  assert.match(personal.createOptions.name, /^john-doe-/);
});

test("an existing non-full private-messages category is reused", async () => {
  const guildChannels = new Collection();
  const category = createCategory({ id: pmCategory, name: "private-messages" });
  guildChannels.set(category.id, category);
  const { collector, guild } = await requestVerification({ guildChannels });
  await collector.emitCollect(adminButton("newtrainer"));
  assert.equal(
    guild.createdChannels.filter((c) => c.type === ChannelType.GuildCategory).length,
    0,
    "no new category may be created"
  );
  const personal = guild.createdChannels[0];
  assert.equal(personal.createOptions.parent, category);
});

test("a full private-messages category (45 children) overflows into a new one", async () => {
  const children = new Collection();
  for (let i = 0; i < 45; i++) children.set(`child-${i}`, { id: `child-${i}` });
  const fullCategory = createCategory({ id: pmCategory, name: "private-messages", children });
  const guildChannels = new Collection([[fullCategory.id, fullCategory]]);
  const { collector, guild } = await requestVerification({ guildChannels });
  await collector.emitCollect(adminButton("newtrainer"));
  const newCategory = guild.createdChannels.find((c) => c.type === ChannelType.GuildCategory);
  assert.equal(newCategory.name, "private-messages-");
  const personal = guild.createdChannels.find((c) => c.type !== ChannelType.GuildCategory);
  assert.equal(personal.createOptions.parent, newCategory);
});

test("a failure while granting the role reports back to the clicking admin", async () => {
  const { collector, guild } = await requestVerification({ roleAddError: new Error("Missing Permissions") });
  const button = adminButton("newtrainer");
  await collector.emitCollect(button);
  assert.match(button.edits[0].content, /Could not complete verification/);
  assert.equal(guild.createdChannels.length, 0, "no channel may be created when the role grant fails");
});
