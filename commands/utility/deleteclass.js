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
    const role = interaction.guild.roles.cache.find(
      (role) => role.name == channel.name
    );

    try {
      await channel.delete();
      await role.delete();
      await interaction.reply({
        content: "The channel has been deleted",
        ephermal: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "An error occurred while deleting the channel.",
        ephermal: true,
      });
    }
  },
};
