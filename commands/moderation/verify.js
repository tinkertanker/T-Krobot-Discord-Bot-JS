const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

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
    const roles = {
      verified: "",
      admininstrator: "",
    };

    await channel.send({
      content: "<todo: ping the verifiers role>",
      embeds: [
        new EmbedBuilder()
          .setTitle(`${name} joined. `)
          .setDescription(
            `${name} has just joined the server. If you recognise the user as a trainer, choose Yes and they will be let in.`
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("accept")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("reject")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    return interaction.reply({
      content: `Wait for a while, we are verifying you`,
      ephemeral: true,
    });
  },
};
// put this into the main code later
client.on("interactionCreate", (interaction) => {
  if (interaction.isButton()) {
    const role = interaction.guild.roles.cache.get(roles[interaction.customId]);
    if (!role)
      return interaction.reply({ content: "Role not found", ephemeral: true });

    return interaction.member.roles
      .add(role)
      .then((member) =>
        interaction.reply({
          content: `The ${role} was added to you`,
          ephemeral: true,
        })
      )
      .catch((err) => {
        console.log(err);
        return interaction.reply({
          content: "Something went wrong",
          ephemeral: true,
        });
      });
  }
});
