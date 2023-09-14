const { SlashCommandBuilder } = require("discord.js");
const shortenURL = require("../../shorten.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shorten")
    .setDescription("Shortens your url")
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
    const result = await shortenURL(originalURL, path);

    if ("error" in result) {
      await interaction.reply(`An error occured: ${result.error}`);
      return;
    }

    await interaction.reply(result.shortURL);
  },
};
