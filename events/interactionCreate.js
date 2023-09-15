const { Events, ButtonBuilder } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
    } else if (interaction.isButton()) {
      if (ButtonBuilder.customId === "yes") {
        const role = interaction.options.getRole("Verified");
        const member = interaction.options.getMember("target");
        member.roles.add(role);
      } else if (ButtonBuilder.customId === "no") {
        return interaction.reply("try again");
      }
    } else if (interaction.isStringSelectMenu()) {
      // respond to the select menu
    }
  },
};
