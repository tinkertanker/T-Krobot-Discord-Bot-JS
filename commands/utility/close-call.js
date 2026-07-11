const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close-call")
    .setDescription("Closes an existing CFI and archives its thread")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("message-id")
        .setDescription("The message ID of the CFI to be closed")
        .setRequired(true)
    ),

  async execute(interaction) {
    const { options } = interaction;
    const messageID = options.getString("message-id");

    await interaction.deferReply({ ephemeral: true });
    try {
          const message = await interaction.channel.messages.fetch(messageID);
          await message.reactions.removeAll();
          await message.react("❌");
          if (message.hasThread && message.thread) {
            await message.thread.setLocked(true, "The CFI is now closed.");
            return interaction.editReply("The thread is now locked. Only members with the Manage Threads permission can send messages.");
          } else {
            return interaction.editReply("The call was closed, but there is no thread on the message to lock.");
          }
    } catch (error) {
          console.error(error);
          return interaction.editReply("I couldn't find or close that CFI message.");
    }
  },
};
