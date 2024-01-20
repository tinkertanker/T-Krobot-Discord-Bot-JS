const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("edit-cfi")
    .setDescription("Edit a sent CFI message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("messageid")
        .setDescription("The message ID of the CFI you wish to edit.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("new-title")
        .setDescription("The new title, if you wish to change it.")
    )
    .addStringOption((option) =>
      option
        .setName("new-description")
        .setDescription("The new description, if you wish to change it.")
    )
    .addStringOption((option) =>
      option
        .setName("new-timing")
        .setDescription(
          "The new timing for the workshop, if you wish to change it. Use \n for new line"
        )
    )
    .addStringOption((option) =>
      option
        .setName("new-location")
        .setDescription("The new location, if you wish to change it.")
    )
    .addStringOption((option) =>
      option
        .setName("new-manpower")
        .setDescription(
          "The new number of trainers needed, if you wish to change it."
        )
    )
    .addStringOption((option) =>
      option
        .setName("new-url")
        .setDescription(
          "The new URL, if you wish to change it. Remember to add the https://"
        )
    )
    .addAttachmentOption((option) =>
      option
        .setName("new-image")
        .setDescription("The new image, if you wish to change it.")
    ),
  async execute(interaction) {
    const { options } = interaction;
    const title = options.getString("new-title");
    const messageID = options.getString("messageid");
    const targetMessage = interaction.channel.messages.fetch(messageID)
    const targetEmbed = targetMessage.embeds[0]
    const newEmbed = EmbedBuilder.from(targetEmbed).setTitle(title)

    try {
      await targetMessage.edit({ embeds: [newEmbed] })
      await interaction.reply("Edited")
    } catch {
      console.error(error)
      await interaction.reply("Smt went wrong")

    }



    // await interaction.channel.messages.fetch(messageID)
    //   .then(async (message) => {
    //     try {
    //       message.edit("penguinfied!!!");
    //     } catch (error) {
    //       console.error(error);
    //       await interaction.reply({
    //         content: "Something went wrong!",
    //         ephemeral: true,
    //       });
    //     }
    //   });
  },
};
