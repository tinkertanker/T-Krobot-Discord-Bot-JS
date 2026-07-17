"use strict";
const { Collection, ChannelType } = require("discord.js");
const { ensureConfig } = require("./config-stub.js");

// Modules under test require config.json at load time; make sure it exists
// before any test file requires them through this helper.
ensureConfig();

/**
 * Mirrors discord.js interaction reply rules so misbehaving commands fail
 * loudly in tests exactly as they would in production:
 *  - reply()/deferReply() throw if the interaction was already acknowledged
 *  - editReply() throws if the interaction was never acknowledged
 */
function createInteraction(overrides = {}) {
  const optionValues = overrides.optionValues ?? {};
  const getOption = (name) => (name in optionValues ? optionValues[name] : null);

  const interaction = {
    deferred: false,
    replied: false,
    deferOptions: null,
    replies: [],
    edits: [],
    user: overrides.user ?? createUser(),
    member: overrides.member ?? null,
    guild: overrides.guild ?? null,
    channel: "channel" in overrides ? overrides.channel : createTextChannel(),
    client: overrides.client ?? { channels: { cache: new Collection() } },
    options: {
      getString: getOption,
      getInteger: getOption,
      getBoolean: getOption,
      getUser: getOption,
      getChannel: getOption,
      getRole: getOption,
      getAttachment: getOption,
    },
    async deferReply(options) {
      if (interaction.deferred || interaction.replied) {
        throw new Error("InteractionAlreadyReplied");
      }
      interaction.deferred = true;
      interaction.deferOptions = options ?? null;
    },
    async reply(payload) {
      if (interaction.deferred || interaction.replied) {
        throw new Error("InteractionAlreadyReplied");
      }
      interaction.replied = true;
      interaction.replies.push(payload);
      return payload;
    },
    async editReply(payload) {
      if (!interaction.deferred && !interaction.replied) {
        throw new Error("InteractionNotReplied");
      }
      interaction.edits.push(payload);
      return payload;
    },
  };
  return interaction;
}

/** Last user-visible payload, whether it went through reply() or editReply(). */
function lastResponse(interaction) {
  const all = [...interaction.replies, ...interaction.edits];
  return all[all.length - 1];
}

function responseText(interaction) {
  const payload = lastResponse(interaction);
  if (payload == null) return null;
  return typeof payload === "string" ? payload : payload.content ?? null;
}

function createUser(overrides = {}) {
  const user = {
    id: overrides.id ?? "user-1",
    username: overrides.username ?? "testuser",
    tag: overrides.tag ?? "testuser#0",
    dms: [],
    displayAvatarURL: () => "https://cdn.example/avatar.png",
    async send(payload) {
      if (overrides.dmError) throw overrides.dmError;
      user.dms.push(payload);
      return payload;
    },
    toString() {
      return `<@${user.id}>`;
    },
  };
  return user;
}

function createRole(overrides = {}) {
  return {
    id: overrides.id ?? "role-1",
    name: overrides.name ?? "some-role",
    color: overrides.color ?? 0,
    toString() {
      return `<@&${this.id}>`;
    },
  };
}

function createMember(overrides = {}) {
  const member = {
    id: overrides.id ?? "user-1",
    nickname: null,
    addedRoles: [],
    removedRoles: [],
    joinedAt: overrides.joinedAt ?? new Date(0),
    roles: {
      cache: overrides.roleCache ?? new Collection(),
      async add(role) {
        if (overrides.roleAddError) throw overrides.roleAddError;
        member.addedRoles.push(role);
      },
      async remove(role) {
        if (overrides.roleRemoveError) throw overrides.roleRemoveError;
        member.removedRoles.push(role);
      },
    },
    async setNickname(name) {
      if (overrides.nicknameError) throw overrides.nicknameError;
      member.nickname = name;
    },
  };
  return member;
}

function createThread(overrides = {}) {
  const thread = {
    name: overrides.name ?? "thread",
    locked: overrides.locked ?? false,
    lockCalls: [],
    edits: [],
    isThread: () => true,
    async setLocked(locked, reason) {
      thread.lockCalls.push([locked, reason]);
      thread.locked = locked;
    },
    async edit(payload) {
      thread.edits.push(payload);
      if (payload.name) thread.name = payload.name;
    },
  };
  return thread;
}

/**
 * Component collector fake. Handlers are stored so tests can await the async
 * work triggered by an emitted event instead of racing it.
 */
function createCollector(options) {
  const handlers = { collect: [], end: [] };
  const collector = {
    options,
    stopped: false,
    endReason: null,
    on(event, handler) {
      handlers[event]?.push(handler);
      return collector;
    },
    stop(reason = "user") {
      if (collector.stopped) return Promise.resolve();
      collector.stopped = true;
      collector.endReason = reason;
      return Promise.all(
        handlers.end.map((handler) => handler(new Collection(), reason))
      );
    },
    async emitCollect(componentInteraction) {
      await Promise.all(
        handlers.collect.map((handler) => handler(componentInteraction))
      );
    },
  };
  return collector;
}

function createMessage(overrides = {}) {
  const message = {
    id: overrides.id ?? "msg-1",
    embeds: overrides.embeds ?? [],
    guild: overrides.guild ?? null,
    hasThread: overrides.hasThread ?? false,
    thread: "thread" in overrides ? overrides.thread : null,
    reactionsRemoved: false,
    reacted: [],
    edits: [],
    startedThread: null,
    collector: null,
    reactions: {
      async removeAll() {
        message.reactionsRemoved = true;
      },
    },
    async react(emoji) {
      if (overrides.reactError) throw overrides.reactError;
      message.reacted.push(emoji);
    },
    async edit(payload) {
      if (overrides.editError) throw overrides.editError;
      message.edits.push(payload);
    },
    async startThread(options) {
      if (overrides.startThreadError) throw overrides.startThreadError;
      message.startedThread = options;
      return createThread({ name: options.name });
    },
    createMessageComponentCollector(options) {
      message.collector = createCollector(options);
      return message.collector;
    },
  };
  return message;
}

function createTextChannel(overrides = {}) {
  const channel = {
    id: overrides.id ?? "chan-1",
    name: overrides.name ?? "general",
    type: overrides.type ?? ChannelType.GuildText,
    parentId: overrides.parentId ?? null,
    sent: [],
    sentMessages: [],
    bulkDeleteCalls: [],
    isTextBased: () => overrides.textBased ?? true,
    async send(payload) {
      if (overrides.sendError) throw overrides.sendError;
      channel.sent.push(payload);
      const message = createMessage({ guild: overrides.guild ?? null });
      channel.sentMessages.push(message);
      return message;
    },
    permissionOverwrites: {
      edits: [],
      async edit(id, permissions) {
        if (overrides.overwriteError) throw overrides.overwriteError;
        channel.permissionOverwrites.edits.push([id, permissions]);
      },
    },
    async bulkDelete(amount, filterOld) {
      if (overrides.bulkDeleteError) throw overrides.bulkDeleteError;
      channel.bulkDeleteCalls.push([amount, filterOld]);
      return { size: overrides.bulkDeleteSize ?? amount };
    },
    messages: {
      async fetch(id) {
        const known = overrides.messages ?? {};
        if (id in known) return known[id];
        throw new Error("Unknown Message");
      },
    },
    async setParent(category) {
      if (overrides.setParentError) throw overrides.setParentError;
      channel.parentId = category.id;
      channel.parent = category;
    },
    async delete() {
      if (overrides.deleteError) throw overrides.deleteError;
      channel.deleted = true;
    },
    toString() {
      return `<#${channel.id}>`;
    },
  };
  return channel;
}

function createCategory(overrides = {}) {
  return {
    id: overrides.id ?? "cat-1",
    name: overrides.name ?? "category",
    type: ChannelType.GuildCategory,
    children: { cache: overrides.children ?? new Collection() },
    toString() {
      return `<#${this.id}>`;
    },
  };
}

function createGuild(overrides = {}) {
  const channelsCache = overrides.channels ?? new Collection();
  const members = overrides.members ?? new Collection();
  const guild = {
    id: overrides.id ?? "guild-1",
    name: overrides.name ?? "Test Guild",
    memberCount: overrides.memberCount ?? 2,
    createdChannels: [],
    createdRoles: [],
    roles: {
      everyone: { id: overrides.everyoneId ?? "everyone-role" },
      async create(options) {
        if (overrides.roleCreateError) throw overrides.roleCreateError;
        guild.createdRoles.push(options);
        return { ...options, id: `role-${guild.createdRoles.length}` };
      },
    },
    members: {
      async fetch(id) {
        if (overrides.memberFetchError) throw overrides.memberFetchError;
        const member = members.get(id);
        if (!member) throw new Error("Unknown Member");
        return member;
      },
      cache: members,
    },
    channels: {
      cache: channelsCache,
      async fetch(id, options) {
        if (id === undefined) return channelsCache;
        return channelsCache.get(id) ?? null;
      },
      async create(options) {
        if (overrides.channelCreateError) throw overrides.channelCreateError;
        const channel =
          options.type === ChannelType.GuildCategory
            ? createCategory({ id: `created-cat-${guild.createdChannels.length}`, name: options.name })
            : createTextChannel({ id: `created-chan-${guild.createdChannels.length}`, name: options.name });
        channel.createOptions = options;
        guild.createdChannels.push(channel);
        channelsCache.set(channel.id, channel);
        return channel;
      },
    },
  };
  return guild;
}

module.exports = {
  createInteraction,
  lastResponse,
  responseText,
  createUser,
  createRole,
  createMember,
  createThread,
  createCollector,
  createMessage,
  createTextChannel,
  createCategory,
  createGuild,
};
