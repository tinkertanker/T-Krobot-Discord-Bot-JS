const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

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
    .addBooleanOption((option) =>
      option
        .setName("unlock-thread")
        .setDescription("Whether to unlock the thread accompanying the CFI.")
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
    const messageID = options.getString("messageid");
    const unlockThread = options.getBoolean("unlock-thread");

    await interaction.channel.messages
      .fetch(messageID)
      .then(async (message) => {
        const targetEmbed = message.embeds[0];
        const title = options.getString("new-title") ?? targetEmbed.title;
        const what =
          options.getString("new-description") ?? targetEmbed.description;
        const when =
          options.getString("new-timing") ?? targetEmbed.fields[2].value;
        const where =
          options.getString("new-location") ?? targetEmbed.fields[0].value;
        const who =
          options.getString("new-manpower") ?? targetEmbed.fields[1].value;
        const link =
          options.getString("new-link") ?? targetEmbed.url ?? "No link";
        const image =
          options.getAttachment("new-image") ?? targetEmbed.image.url;
        const newEmbed = EmbedBuilder.from(targetEmbed)
          .setTitle(
            link.includes("https://") &&
              !title.includes(" (Click here for map link)")
              ? title.replaceAll(/\\n/g, "\n") + " (Click here for map link)"
              : title.replaceAll(/\\n/g, "\n")
          )
          .setDescription(what.replaceAll(/\\n/g, "\n"))
          .setURL(link.includes("No link") ? null : link)
          .setFields(
            {
              name: "Where",
              value: where.replaceAll(/\\n/g, "\n"),
              inline: true,
            },
            { name: "Who", value: who.replaceAll(/\\n/g, "\n"), inline: true },
            { name: "When", value: when.replaceAll(/\\n/g, "\n") }
          )
          .setImage(typeof image == "string" ? image : image.url);

        try {
          await message.edit({ embeds: [newEmbed] });
          await interaction.reply({ content: "Edited.", ephemeral: true });
          if (message.embeds.length !== 0 || message.hasThread) {
            await message.thread.edit({ name: "CFI: " + title });
            await interaction.followUp({
              content: "Thread name edited as well.",
              ephemeral: true,
            });
            if (unlockThread && message.thread.locked) {
              await message.thread.setLocked(false);
              await interaction.followUp({
                content: "Thread unlocked.",
                ephemeral: true,
              });
            } else if (!message.thread.locked) {
              await interaction.followUp({
                content: "Thread is not locked.", 
                ephemeral: true
              });
            }
          } else {
            await interaction.followUp({
              content: "There is no accompanying thread to edit.",
              ephemeral: true,
            });
          }
        } catch (error) {
          console.error(error);
          await interaction.reply({
            content: "Something went wrong!",
            ephemeral: true,
          });
        }
      });
  },
};
