const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  // eslint-disable-next-line no-unused-vars
  GuildCategory,
} = require("discord.js");

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
    const { ViewChannel, ReadMessageHistory, SendMessages, Connect, Speak } =
      PermissionFlagsBits;
    const channeltype = options.getString("channeltype");
    const channelname = options.getString("channelname");
    const parent = options.getChannel("parent");
    const permissions = options.getRole("permission-role");

    if (channeltype === "textchannel") {
      try {
        await guild.channels.create({
          name: `${channelname}`,
          type: ChannelType.GuildText,
          parent: parent,
          permissionOverwrites: [
            {
              id: permissions,
              allow: [ViewChannel, SendMessages, ReadMessageHistory],
            },
          ],
        });
        guild.roles.create({
          data: {
            name: `${channelname}`,
            color: "BLUE",
          },
        });
        await interaction.reply({
          content: "The text channel has been created",
          ephermal: true,
        });
      } catch (error) {
        console.error(error);
        interaction.reply("An error occurred while creating the channel.");
      }
    }
    if (channeltype === "voicechannel") {
      try {
        await guild.channels.create({
          name: `${channelname}`,
          type: ChannelType.GuildText,
          parent: parent,
          permissionOverwrites: [
            {
              id: permissions,
              allow: [ViewChannel, Connect, Speak],
            },
          ],
        });
        guild.roles.create({
          data: {
            name: `${channelname}`,
            color: "BLUE",
          },
        });
        await interaction.reply({
          content: "The voice channel has been created",
          ephermal: true,
        });
      } catch (error) {
        console.error(error);
        interaction.reply({
          content: "An error occurred while creating the channel.",
          ephermal: true,
        });
      }
    }
  },
};
