const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-role")
    .setDescription("add a role to a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) //Update bot permissions, apparently the bot does not have admin
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("the user the role is to be added to")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("the role to add").setRequired(true)
    ),
  // eslint-disable-next-line no-unused-vars
  async execute(interaction, client) {
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");
    const member = await interaction.guild.members.fetch(user.id);
    if (member.roles.cache.has(role.id)) {
      const embed = new EmbedBuilder()
        .setColor("Aqua")
        .setDescription(`User ${user} already has the role \`${role.name}\`.`)
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    try {
      await interaction.guild.members.cache.get(user.id).roles.add(role);
      const embed = new EmbedBuilder()
        .setColor(role.color)
        .setDescription(`Succesfully added role \`${role.name}\`to ${user} `)
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor("DarkVividPink")
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp()
        .setDescription(
          `Failed to add role \`${role.name}\`to user \`${user.tag}\`.`
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
