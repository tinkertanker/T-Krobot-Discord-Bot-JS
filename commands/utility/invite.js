const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
      .setName("invite")
      .setDescription("Invite up to 5 members to a active class text channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addChannelOption(option => 
        option 
          .setName("channel")
          .setDescription("The channel that you wish to add users to")
          .setRequired(true))
      .addUserOption(option =>
        option
          .setName("user1")
          .setDescription("The user that you wish to add")
          .setRequired(true))
      .addUserOption(option =>
        option
          .setName("user2")
          .setDescription("The user that you wish to add"))
      .addUserOption(option =>
        option
          .setName("user3")
          .setDescription("The user that you wish to add"))
      .addUserOption(option =>
        option
          .setName("user4")
          .setDescription("The user that you wish to add"))
      .addUserOption(option =>
        option
          .setName("user5")
          .setDescription("The user that you wish to add")),

  async execute(interaction) {
    const { options } = interaction;
    const targetChannel = options.getChannel("channel");
    const usersById = new Map();

    for (let i = 1; i <= 5; i++) {
      const user = options.getUser(`user${i}`);
      if (user) usersById.set(user.id, user);
    }
    const users = [...usersById.values()];

    try {
      await interaction.deferReply({ ephemeral: true });
      for (const user of users) {
        await targetChannel.permissionOverwrites.edit(user.id, { ViewChannel: true });
      }
      await interaction.editReply(`Added ${users.map((user) => user.username).join(", ")}.`);
    } catch(error) {
      console.error(error);
      await interaction.editReply("I couldn't add all of those members. Check my channel permissions and try again.");
    }
  }
}
