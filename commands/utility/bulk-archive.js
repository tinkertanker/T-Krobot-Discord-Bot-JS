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
    
    const client = interaction.client;
    const channels = client.channels.cache.filter(channel => channel.name.startsWith(channelPrefixToMove));
    var good = 0, bad = 0;
    await channels.forEach((channel) => {
      try {
        channel.setParent(categoryToMoveTo);
        good += 1;
      } catch (error) {
        console.error(error);
        bad += 1;
      }
    });
    if(bad == 0){
      interaction.reply(`Moved ${good} channels with prefix ${channelPrefixToMove} to ${categoryToMoveTo}.`);
    } else {
      interaction.reply({
        content: `Moved ${good} channels, ${bad} channels were unsuccesfully moved.`,
        ephermal: true,
      });
    }
  },
};
