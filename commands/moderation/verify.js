const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Lets you sbe verified.")
    .addStringOption((option) =>
      option.setName("name").setDescription("Your name").setRequired(true)
    ),
  async execute(interaction) {
    const client = interaction.client;
    const name = interaction.options.getString("name");
    const channel = client.channels.cache.get("1086943862796333118");
    const trainerRole = "1086943974004113481";
    const tinkertankerRole = "1086189634008141824";
    const { guild } = interaction;
    const { ViewChannel, ReadMessageHistory, SendMessages } =
      PermissionFlagsBits;
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${name} joined. `)
          .setDescription(
            `${name} has just joined the server. If you recognise the user as a trainer, choose Trainer and they will be let in.`
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("verified")
            .setLabel("Trainer")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("tinkertanker")
            .setLabel("Tinkertanker")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("reject")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
    client.on("interactionCreate", async (interaction) => {
      async function doStuff(role) {
        //Mods side
        await interaction.member.roles
          .add(role)
          // eslint-disable-next-line no-unused-vars
          .then((member) =>
            interaction.reply({
              content: `User is now Verified `,
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
        //User side
        await interaction.user.send("You are now verified");
        //create a personal channel
        await interaction.guild.channels
          .create({
            name: `${name.replace(" ", "-")}`,
            type: ChannelType.GuildText,
            parent: "1103947971734810745",
            permissionOverwrites: [
              {
                id: interaction.user.id,
                allow: [ViewChannel, SendMessages, ReadMessageHistory],
              },
              {
                id: guild.roles.everyone.id,
                deny: [ViewChannel],
              },
            ],
          })
          .then((channel) => channel.send("Welcome to your channel!"))
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "Could not create channel",
              ephemeral: true,
            });
          });
      }

      if (interaction.isButton()) {
        if (interaction.customId == "verified") {
          doStuff(trainerRole);
        } else if (interaction.customId == "tinkertanker") {
          doStuff(tinkertankerRole);
        } else {
          //mods side, no need return
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
