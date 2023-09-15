const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("archive")
    .setDescription("Archives a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("channelname")
        .setDescription("Input the name of the channel")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("categoryname")
        .setDescription("the category you want it to be moved to")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    ),
  async execute(interaction) {
    // eslint-disable-next-line no-unused-vars
    const { guild, member, options } = interaction;
    const channelToMove = options.getChannel("channelname");
    const categoryToMoveTo = options.getChannel("categoryname");

    if (!channelToMove || !categoryToMoveTo) {
      return interaction.reply("Invalid channel or category.");
    }

    try {
      await channelToMove.setParent(categoryToMoveTo);
      interaction.reply(`Moved ${channelToMove} to ${categoryToMoveTo}.`);
    } catch (error) {
      console.error(error);
      interaction.reply("An error occurred while moving the channel.");
    }
  },
};
