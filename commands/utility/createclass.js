const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField,
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

    if (channeltype === "textchannel") {
      try {
        await guild.channels
          .create({
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
          })
          .then((channel) => channel.send(`<@${userID}> Welcome to the channel!`))
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "The channel could not be created",
              ephemeral: true,
            });
          });
        guild.roles
          .create({
            name: `${channelname.replace(" ", "-")}`,
            permissions: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
            color: "Blue",
          })
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "The role could not be created",
              ephemeral: true,
            });
          });
        await interaction.reply({
          content: "The text channel has been created",
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        interaction.reply("An error occurred while creating the channel.");
      }
    }
    if (channeltype === "voicechannel") {
      try {
        await guild.channels
          .create({
            name: `${channelname}`,
            type: ChannelType.GuildText,
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
          })
          .then((channel) => channel.send(`<@${userID}> Welcome to the channel!`))
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "The channel could not be created",
              ephemeral: true,
            });
          });
        guild.roles
          .create({
            name: `${channelname.replace(" ", "-")}`,
            permissions: [
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
            color: "Blue",
          })
          .then((channel) => channel.send("Welcome to the channel!"))
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "The role could not be created",
              ephemeral: true,
            });
          });
        await interaction.reply({
          content: "The voice channel has been created",
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        interaction.reply({
          content: "An error occurred while creating the channel.",
          ephemeral: true,
        });
      }
    }
  },
};
