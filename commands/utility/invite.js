const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
      .setName("invite")
      .setDescription("Invite up to 5 members to a active class text channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.administrator)
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
    let users = [];
    
    for (let i = 1; i <= 5; i++) {
      users.push(options.getUser("user" + i.toString()) ?? "No user");
    };

    try {
      await interaction.reply({ content: "Adding members...", ephemeral: true });
      for (let x in users) {
        if (users[x] !== "No user") {
          console.log(users[x])
          await targetChannel.permissionOverwrites.edit(users[x].id, { ViewChannel: true });
          await interaction.editReply({ content: `${users[x].username} has been added.`, ephemeral: true });
        } else {
          console.log(`No user recieved ${users[x].username}`);
        }
      }
    } catch(error) {
      console.error(error);
    }
  }
}