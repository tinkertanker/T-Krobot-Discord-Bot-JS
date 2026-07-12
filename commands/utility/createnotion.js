const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const createNotionPage = require("../../notion.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("notion")
    .setDescription("Creates a new notion page")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName("notionname")
        .setRequired(true)
        .setDescription("Set the name of the page")
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setRequired(true)
        .setDescription("Description of the page")
    ),
  // the functions of this object
  async execute(interaction) {
    const { options } = interaction;
    const name = options.getString("notionname");
    const discordInfo = options.getString("description");
    await interaction.deferReply({ ephemeral: true });
    try {
      const result = await createNotionPage(name, discordInfo);
      if ("error" in result || !result.url) {
        console.error("Notion page creation failed", result.error);
        return interaction.editReply("The Notion page could not be created. Please try again later.");
      }
      return interaction.editReply(`The notion has been created at ${result.url}`);
    } catch (error) {
      console.error(error);
      return interaction.editReply("The Notion page could not be created. Please try again later.");
    }
  },
};
