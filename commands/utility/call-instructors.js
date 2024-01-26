const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  bold,
  underscore,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("call-instructors")
    .setDescription(
      "Posts a call for instructors notice with various details included. Creates an accompanying thread."
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Add name of the class")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("when")
        .setDescription("Add the time of the class")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("where")
        .setDescription("Add the location of the class")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("who")
        .setDescription("Add the number of instructors needed")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("what")
        .setDescription("Add any necessary details")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("Add any relevant URL. Don't forget the https://")
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("Add any accompanying image reference.")
    ),

  async execute(interaction) {
    const { options } = interaction;
    const className = options.getString("title").replaceAll(/\\n/g, "\n");
    const classDetails =
      options.getString("what").replaceAll(/\\n/g, "\n") ??
      "No specific details have been provided.";
    const classTime = options.getString("when").replaceAll(/\\n/g, "\n");
    const classLocation = options.getString("where").replaceAll(/\\n/g, "\n");
    const classManpower = options.getString("who").replaceAll(/\\n/g, "\n");
    const classURL = options.getString("link") ?? "No link";
    let classImage =
      options.getAttachment("image") ??
      "https://tinkertanker.com/assets/images/image09.png?v=b3748329";
    const channel = interaction.channel ?? "Not a text channel";

    if (typeof classImage !== "string") {
      classImage = classImage.url;
    }

    const replyEmbed = await new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(
        classURL.includes("https://")
          ? className + " (Click here for map link)"
          : className
      )
      .setURL(classURL.includes("No link") ? null : classURL)
      .setDescription(classDetails)
      .addFields(
        { name: "Where", value: classLocation, inline: true },
        { name: "Who", value: classManpower, inline: true },
        { name: "When", value: classTime },
        { name: "CFI Status", value: "✅: CFI is open • ❌: CFI has closed" }
      )
      .setImage(classImage);

    const reply = await channel.send({ embeds: [replyEmbed] });

    try {
      await reply.startThread({
        name: `CFI: ${className}`,
        autoArchiveDuration: 1440,
      });
      await interaction.reply({
        content: "Your thread has been successfully created",
        ephemeral: true,
      });
      await reply.react("✅");
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "An error occurred while creating the accompanying thread.",
        ephemeral: true,
      });
    }
  },
};
