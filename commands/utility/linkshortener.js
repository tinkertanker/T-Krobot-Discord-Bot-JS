const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const shortenURL = require("../../shorten.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shorten")
    .setDescription("Shortens your url")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option.setName("originalurl").setRequired(true).setDescription("Long url")
    )
    .addStringOption((option) =>
      option
        .setName("wantedpath")
        .setRequired(true)
        .setDescription("Path for new url")
    ),
  async execute(interaction) {
    const { options } = interaction;
    const originalURL = options.getString("originalurl");
    const path = options.getString("wantedpath");
    let url;
    try {
      url = new URL(originalURL);
    } catch {
      return interaction.reply({ content: "Please provide a valid HTTP or HTTPS URL.", ephemeral: true });
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      return interaction.reply({ content: "Only HTTP and HTTPS URLs can be shortened.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const result = await shortenURL(url.toString(), path);

    if ("error" in result) {
      console.error("URL shortening failed", result.error);
      return interaction.editReply("The URL could not be shortened. Check the requested path and try again.");
    }

    await interaction.editReply(result.shortURL);
  },
};
