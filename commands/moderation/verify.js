const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Lets you be verified.")
    .addStringOption((option) =>
      option.setName("name").setDescription("Your name").setRequired(true)
    ),
  async execute(interaction) {
    const client = interaction.client;
    const name = interaction.options.getString("name");
    const channel = client.channels.cache.get("1150657346817769560");

    await channel.send(" Do you want to verify " + name + "?");

    return interaction.reply({
      content: `Wait for review`,
      ephemeral: true,
    });
  },
};
