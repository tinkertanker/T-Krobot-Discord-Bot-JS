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

    await interaction.deferReply({ ephemeral: true });
    try {
        const message = await interaction.channel.messages.fetch(messageID);
        if (!message.embeds.length) {
          return interaction.editReply("That message does not contain a CFI embed.");
        }
        const targetEmbed = message.embeds[0];
        // A CFI embed always carries a title, a description, and at least the
        // Where/Who/When fields. Anything else (another bot's embed, a bare
        // link preview) would crash the rewrite below.
        if (
          !targetEmbed.title ||
          !targetEmbed.description ||
          (targetEmbed.fields?.length ?? 0) < 3
        ) {
          return interaction.editReply("That message does not contain a CFI embed.");
        }
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
          options.getString("new-url") ?? targetEmbed.url ?? "No link";
        const image =
          options.getAttachment("new-image") ?? targetEmbed.image?.url ?? null;
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
            { name: "When", value: when.replaceAll(/\\n/g, "\n") },
            ...targetEmbed.fields.slice(3).map((field) => ({
              name: field.name,
              value: field.value,
              inline: field.inline,
            }))
          )
          .setImage(image ? (typeof image == "string" ? image : image.url) : null);

          await message.edit({ embeds: [newEmbed] });
          const updates = ["Edited."];
          const thread = message.hasThread
            ? message.thread ?? await message.guild.channels.fetch(message.id, { force: true })
            : null;
          if (thread?.isThread()) {
            await thread.edit({ name: "CFI: " + title });
            updates.push("Thread name edited as well.");
            if (unlockThread && thread.locked) {
              await thread.setLocked(false);
              updates.push("Thread unlocked.");
            } else if (!thread.locked) {
              updates.push("Thread is not locked.");
            }
          } else {
            updates.push("There is no accompanying thread to edit.");
          }
          return interaction.editReply(updates.join(" "));
    } catch (error) {
      console.error(error);
      return interaction.editReply("I couldn't find or edit that CFI message.");
    }
  },
};
