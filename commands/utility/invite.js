const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
  } = require("discord.js");

  module.exports = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDiscription("Invite a member to this active class text channel")
        .setDefaultMemberPermissions(PermissionFlagsBits.administrator)
        .addUserOption(option =>
          option.setName("user")
            .setRequired(true)),
    async execute(interaction) {
      const { options } = interaction;
      const user = options.getUser("user");

      try {
        await ChannelType.permissionOverwrites.edit(option, {ViewChannel: true});
      } catch {
        console.error(error);
        console.log(user)
      }
    }
  }