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
const pendingVerifications = new Map();

const welcomeMessage1 = `
Some starting info from Tracey:\n
- To get started, just keep an eye out on <#1086464698469339246> for classes. When interested, just reply in a thread that you can make it and we'll endeavour to confirm ASAP.
- This channel (under PRIVATE-MESSAGES) is private to you and the admins (anyone in red in the sidebar — usually Tinkertanker staff). Send questions here, or if really private, can WhatsApp me / whoever you know.
- If you're new to Discord, we have some tips for managing things in <#1086466750368977056>
- Feel free to chat with us or anyone in <#1088022816399560814>
- When we confirm a class, we set up chat channels for them.
- There are topics channels you can wander in to as well to discuss, and questions channels (like <#1088022734082162738>) to ask and answer questions.
- Do note the requirements for each class. In particular, school classes need MOE registration, which takes 6-8 weeks (it\'s a security clearance).
- If you\'d like to learn something new from our curriculum, let me know, I can get you access to our slides.
- You\'re also welcome to learn something new by assisting for it — but please make sure to go in prepared!
`;
const welcomeMessage2 = `
On payment (see <#1088022734082162738> for more details)\n
- Once an engagement is confirmed, we\'ll add you to our calendaring system, which will send you a schedule invite. Do take note that the dates, times, and durations are correct, as these will then auto-populate your pay for the following pay cycle.
- Pay comes in around the end of the following month, by bank transfer. As a contractor, you should generate an invoice; we\'re just automating things through our payroll system.
- Once you run your first class with us, please provide me the following information to get started: (a) Full name, (b) NRIC number (or, if you\'d rather not provide, just confirm that you are eligible to work in Singapore, i.e. being a citizen, PR, or your student pass allows for it), (c) Email for payroll system to reach you
- We will set something up, then ask you to fill in a particulars form with your bank account info
- From there on, pay will be sent after the 30th of the following month, together with a “payslip” detailing the name of the class.
- For other claims, please use https://tk.sg/timesheet.\n
Let me know if you have any questions at all!
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Lets an admin verify you.")
    .addStringOption((option) =>
      option.setName("name").setDescription("Your full name").setRequired(true)
    ),
  async execute(interaction) {
    const client = interaction.client;
    const newUser = interaction.user;
    const newName = interaction.options.getString("name");
    const vChannel = client.channels.cache.get(verificationChannel);
    const { guild } = interaction;
    const { ViewChannel, ReadMessageHistory, SendMessages } = PermissionFlagsBits;
    const pendingKey = `${guild.id}:${newUser.id}`;

    await interaction.deferReply({ ephemeral: true });
    if (pendingVerifications.has(pendingKey)) {
      return interaction.editReply("You already have a verification request waiting for an administrator.");
    }
    if (!vChannel?.isTextBased()) {
      console.error("The configured verification channel is unavailable or not text-based.");
      return interaction.editReply("Verification is not configured correctly. Please contact an administrator.");
    }

    pendingVerifications.set(pendingKey, true);
    let unique;
    try {
      unique = await vChannel.send({
      content: `${newUser} joined.`,
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `${newName} has just joined the server. Choose the appropriate role or reject them.`
          ),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("newtrainer")
            .setLabel("Trainer")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("newtinkertanker")
            .setLabel("Tinkertanker")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("newreject")
            .setLabel("Reject")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
      });
    } catch (error) {
      pendingVerifications.delete(pendingKey);
      throw error;
    }

    const collector = unique.createMessageComponentCollector({
      time: 604800000,
      filter: (buttonInteraction) =>
        buttonInteraction.memberPermissions?.has(PermissionFlagsBits.Administrator),
    });
    pendingVerifications.set(pendingKey, collector);
    collector.on("end", async (_collected, reason) => {
      if (pendingVerifications.get(pendingKey) === collector) {
        pendingVerifications.delete(pendingKey);
      }
      if (reason === "time") {
        await unique.edit({
          content: `${newUser}'s verification request expired. Ask them to run /verify again.`,
          embeds: [],
          components: [],
        }).catch((error) => console.error("Could not disable an expired verification request", error));
      }
    });
    let handled = false;
    collector.on('collect', async buttonInteraction => {
      if (handled) return;
      handled = true;
      collector.stop("handled");

      async function giveRole(role) {
        const newMember = await guild.members.fetch(newUser.id);
        //Set Nickname
        await newMember.setNickname(newName).catch((err) => {
          console.log(err);
          console.log("Could not set nickname!");
        });
        //Give user role
        let roleString = "";
        if(role == trainerRole) roleString = "Trainer";
        else if(role == tinkertankerRole) roleString = "Tinkertanker";
        await newMember.roles.add(role);
        //Inform user
        await newUser.send("You are now verified").catch((err) => {
          console.log("Could not DM verified user", err.message);
        });

        var allChannels = await interaction.guild.channels.fetch();
        //Create a personal channel
        let channelName = newName.replaceAll(" ", "-").toLowerCase();
        while(allChannels.find(c => c.name.toLowerCase() === channelName)) {
          channelName += '-';
          channelName += (Math.random() + 1).toString(36).substring(7);
        }

        allChannels = await interaction.guild.channels.fetch();
        let categoryName = "private-messages";
        let parentCategory = pmCategory ? allChannels.get(pmCategory) : null;
        if (parentCategory?.type !== ChannelType.GuildCategory) parentCategory = null;
        parentCategory ??= allChannels.find((cat) => cat.name === categoryName && cat.type === ChannelType.GuildCategory);
        while(true){
          parentCategory ??= allChannels.find((cat) => cat.name === categoryName && cat.type === ChannelType.GuildCategory);
          try {
            if(parentCategory.children.cache.size >= 45) {
              categoryName += "-";
              parentCategory = null;
            }
            else break;
          } catch(err){
            parentCategory = await guild.channels.create({ name: categoryName, type: ChannelType.GuildCategory });
            break;
          }
        }

        const channel = await guild.channels
          .create({
            name: `${channelName}`,
            type: ChannelType.GuildText,
            parent: parentCategory,
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
          });
        await channel.send(`Welcome to your channel ${newUser}!`);
        await channel.send(welcomeMessage1);
        await channel.send(welcomeMessage2);
        await buttonInteraction.editReply({
          content: `${newUser} is now verified with ${roleString} role and channel ${channel} has been created`,
          embeds: [],
          components: [],
        });
      }

      if (buttonInteraction.isButton()) {
        await buttonInteraction.deferUpdate();
        try {
          if (buttonInteraction.customId == "newtrainer") {
            await giveRole(trainerRole);
          } else if (buttonInteraction.customId == "newtinkertanker") {
            await giveRole(tinkertankerRole);
          } else if (buttonInteraction.customId === "newreject") {
            //To admins
            await buttonInteraction.editReply({
              content: `${newUser} was rejected.`,
              embeds: [],
              components: [],
            });
            //To user
            await newUser.send("Try again, or contact an admin.").catch((err) => {
              console.log("Could not DM rejected user", err.message);
            });
          }
        } catch (error) {
          console.error(error);
          await buttonInteraction.editReply({
            content: `Could not complete verification for ${newUser}. Check my role and channel permissions.`,
            embeds: [],
            components: [],
          });
        }
      }
    });
    //User side
    return interaction.editReply("Wait for a while, we are verifying you");
  },
};
