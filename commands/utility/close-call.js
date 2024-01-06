const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("close-call")
        .setDescription("Closes an existing CFI and archives its thread")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption( option => 
            option
                .setName("message-id")
                .setDescription("The message ID of the CFI to be closed")
                .setRequired(true)),

    async execute(interaction) {
        const { options } = interaction
        const messageID = options.getString("message-id");
      
        await interaction.channel.messages.fetch(messageID).then(async (message) => {
            try {
              await message.react("❌");
              console.log("reacted"); 
              console.log(message.hasThread)
              if (message.hasThread) {
                  await message.thread.setLocked(true, "The CFI is now closed.")
                  await interaction.reply({ content: "The thread is now locked. Only members with the Manage Threads permissions can send messages.", ephemeral: true })
              } else {
                  await interaction.reply({ content: "The CFI message does not have a thread to archive.", ephemeral: true })
              }
          } catch(error) {
              console.error(error); 
              await interaction.reply({ content: "Something went wrong!", ephemeral: true })
          }
        });
    }
}