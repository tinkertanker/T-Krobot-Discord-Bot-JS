const { SlashCommandBuilder, PermissionFlagBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete-channel")
    .setDescription("Delete a Discord channel")
    .setDefaultMemberPermissions(PermissionFlagBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Select the channel you want to delete")
        .setRequired(true)
    ),
  async exectue(interaction) {
    const { options } = interaction;
    const channel = options.getChannel("channel");
    channel.delete();
    await interaction.reply({
      content: "The channel has been deleted",
      ephermal: true,
    });
  },
};
