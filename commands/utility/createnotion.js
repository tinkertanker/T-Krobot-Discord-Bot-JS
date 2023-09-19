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
    const result = await createNotionPage(name, discordInfo);

    await interaction.reply({
      content: `The notion has been created at ${result.url}`,
      ephermal: true,
    });
    if ("error" in result) {
      await interaction.reply(`An error occured: ${result.error}`);
      return;
    }
  },
};
