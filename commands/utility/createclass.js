const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField,
  // eslint-disable-next-line no-unused-vars
  GuildCategory,
} = require("discord.js");
const createNotionPage = require("../../notion.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription("Creates a new class channel and voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName("channeltype")
        .setRequired(true)
        .setDescription("Set the type of Channel")
        .addChoices(
          { name: "Text channel", value: "textchannel" },
          { name: "Voice channel", value: "voicechannel" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("channelname")
        .setDescription("Set the name of the channel")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("parent")
        .setDescription("Set the parent of the channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addRoleOption((option) =>
      option
        .setName("permission-role")
        .setDescription("The permission role of the channel")
        .setRequired(true)
    ),

  // the functions of this object
  async execute(interaction) {
    // eslint-disable-next-line no-unused-vars
    const { guild, member, options } = interaction;
    const {
      ViewChannel,
      ReadMessageHistory,
      ManageChannels,
      ManageRoles,
      SendMessages,
      Connect,
      Speak,
    } = PermissionFlagsBits;
    const channeltype = options.getString("channeltype");
    const channelname = options.getString("channelname");
    const parent = options.getChannel("parent");
    const permissions = options.getRole("permission-role");
    const everyoneID = guild.roles.everyone.id;
    const userID = interaction.user.id;
    await interaction.deferReply({ ephemeral: true });

    if (channeltype === "textchannel") {
      try {
        const channel = await guild.channels.create({
            name: `${channelname}`,
            type: ChannelType.GuildText,
            parent: parent,
            permissionOverwrites: [
              {
                id: permissions,
                allow: [
                  ViewChannel,
                  SendMessages,
                  ReadMessageHistory,
                  ManageChannels,
                  ManageRoles,
                ],
              },
              {
                id: everyoneID,
                deny: ViewChannel,
              }
            ],
          });
        await channel.send(`<@${userID}> Welcome to the channel!`);
        const page = await createNotionPage(channelname, channelname);
        if (page.url) await channel.send(`The text notion has been created at ${page.url}`);
        else console.error("Notion page creation failed", page.error);
        await guild.roles.create({
            name: `${channelname.replaceAll(" ", "-")}`,
            permissions: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
            color: "Blue",
          });
        return interaction.editReply(page.url
          ? "The text channel, role, and Notion page have been created."
          : "The text channel and role were created, but the Notion page could not be created.");
      } catch (error) {
        console.error(error);
        return interaction.editReply("The class channel could not be fully created. Check my channel and role permissions.");
      }
    }
    if (channeltype === "voicechannel") {
      try {
        await guild.channels.create({
            name: `${channelname}`,
            type: ChannelType.GuildVoice,
            parent: parent,
            permissionOverwrites: [
              {
                id: permissions,
                allow: [ViewChannel, Connect, Speak, ManageChannels],
              },
              {
                id: everyoneID,
                deny: ViewChannel,
              }
            ],
          });
        await guild.roles.create({
            name: `${channelname.replaceAll(" ", "-")}`,
            permissions: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
            color: "Blue",
          });
        return interaction.editReply("The voice channel and role have been created.");
      } catch (error) {
        console.error(error);
        return interaction.editReply("The voice channel could not be fully created. Check my channel and role permissions.");
      }
    }
  },
};
