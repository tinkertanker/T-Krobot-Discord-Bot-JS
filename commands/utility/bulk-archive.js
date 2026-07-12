const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bulk-archive")
    .setDescription("Archives multiple channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
    option
      .setName("channelname")
      .setDescription("Input the prefix of the channel names")
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
    const channelPrefixToMove = options.getString("channelname");
    const categoryToMoveTo = options.getChannel("categoryname");
    if (!channelPrefixToMove || !categoryToMoveTo) {
      return interaction.reply("Invalid channel or category.");
    }
    
    await interaction.deferReply({ ephemeral: true });
    const channels = guild.channels.cache.filter((channel) =>
      channel.name.startsWith(channelPrefixToMove) && channel.id !== categoryToMoveTo.id
    );
    let good = 0;
    let bad = 0;
    for (const channel of channels.values()) {
      try {
        await channel.setParent(categoryToMoveTo);
        good += 1;
      } catch (error) {
        console.error(error);
        bad += 1;
      }
    }
    if(bad == 0){
      return interaction.editReply(`Moved ${good} channels with prefix ${channelPrefixToMove} to ${categoryToMoveTo}.`);
    } else {
      return interaction.editReply(`Moved ${good} channels; ${bad} channels could not be moved.`);
    }
  },
};
