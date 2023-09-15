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
    const verifiedRole = "1151010223813820487";

    await channel.send({
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
            .setCustomId("verified")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("reject")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
    client.on("interactionCreate", (interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId == "verified") {
          //Mods side
          interaction.member.roles
            .add(verifiedRole)
            // eslint-disable-next-line no-unused-vars
            .then((member) =>
              interaction.reply({
                content: `User is now verified `,
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
          //User side (may need to async this)
          interaction.user.send("You are now verified");
        } else {
          //mods side, no need return (will just mess up the code)
          interaction.reply({
            content: "User was not given verified role",
            ephemeral: true,
          }); //user side
          interaction.user.send("Try again");
        }
      }
    });
    //User side
    return interaction.reply({
      content: `Wait for a while, we are verifying you`,
      ephemeral: true,
    });
  },
};
