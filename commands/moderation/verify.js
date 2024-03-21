const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const { verificationChannel, trainerRole, tinkertankerRole, pmCategory } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Lets you be verified.")
    .addStringOption((option) =>
      option.setName("name").setDescription("Your full name").setRequired(true)
    ),
  async execute(interaction) {
    const client = interaction.client;
    const user = interaction.user;
    const name = interaction.options.getString("name");
    const channel = client.channels.cache.get(verificationChannel);
    
    const { guild } = interaction;
    const { ViewChannel, ReadMessageHistory, SendMessages } =
      PermissionFlagsBits;
    await channel.send({
      content: `${user} joined.`,
      embeds: [
        new EmbedBuilder()
          //.setTitle(`${name} joined. `)
          .setDescription(
            `${name} has just joined the server. Choose the appropriate role or reject them.`
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
        const newUser = interaction.message.mentions.users.first();
        //Mods side
        newMember = await guild.members.fetch(newUser.id); 
        await newMember.setNickname(name).catch((err) => {
          console.log(err);
          console.log("Could not set nickname!");
        });
        roleString = "";
        if(role == trainerRole) roleString = "Trainer";
        else if(role == tinkertankerRole) roleString = "Tinkertanker";
        await newMember.roles
          .add(role)
          // eslint-disable-next-line no-unused-vars
          //.then((member) =>
          //  interaction.reply({
          //    content: `User is now Verified with ${roleString} role`,
          //  })
          //)
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "Could not set user role!",
              ephemeral: true,
            });
          });
        //User side
        await newUser.send("You are now verified");
        //create a personal channel
        channelName = name.replace(" ", "-").toLowerCase();
        while((interaction.guild.channels.cache.find(c => c.name.toLowerCase() === channelName))) {
          channelName += '-';
          channelName += (Math.random() + 1).toString(36).substring(7);
        }
        await interaction.guild.channels
          .create({
            name: `${channelName}`,
            type: ChannelType.GuildText,
            parent: pmCategory,
            permissionOverwrites: [
              {
                id: newUser.id,
                allow: [ViewChannel, SendMessages, ReadMessageHistory],
              },
              {
                id: guild.roles.everyone.id,
                deny: [ViewChannel],
              },
            ],
          })
          .then((channel) => {
            channel.send(`Welcome to your channel ${name}!`)
          })
          .then(() =>
            interaction.update({
              components: [],
            })
          )
          .then(() => {
            const userTag = interaction.message.mentions.users.first();
            const channelTag = interaction.guild.channels.cache.find(channel => channel.name === channelName).toString()
            interaction.editReply({
              content: `${name} is now verified with ${roleString} role and channel ${channelTag} has been created`,
            })
          })
          .catch((err) => {
            console.log(err);
            return interaction.reply({
              content: "Could not create channel!",
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
            content: "User was not given verified role.",
            ephemeral: true,
          }); //user side
          interaction.user.send("Try again, or contact an admin.");
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
