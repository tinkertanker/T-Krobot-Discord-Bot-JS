const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delete-channel")
    .setDescription("Delete a Discord channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Select the channel you want to delete")
        .setRequired(true)
    ),
  async execute(interaction) {
    const { options } = interaction;
    const channel = options.getChannel("channel");

    await interaction.deferReply({ ephemeral: true });
    try {
      await channel.delete();
      await interaction.editReply("The channel has been deleted. No roles were changed.");
    } catch (error) {
      console.error(error);
      await interaction.editReply("An error occurred while deleting the channel.");
    }
  },
};
