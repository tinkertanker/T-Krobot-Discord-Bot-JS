const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-role")
    .setDescription("remove a role from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) //!!!! This is how you restritct things from members
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("the user the role is to be removed from")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("the role to remove")
        .setRequired(true)
    ),
  // eslint-disable-next-line no-unused-vars
  async execute(interaction, client) {
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");
    const member = await interaction.guild.members.fetch(user.id);

    if (!member.roles.cache.has(role.id)) {
      const embed = new EmbedBuilder()
        .setColor("Aqua")
        .setDescription(`User ${user} doesn't have the role \`${role.name}\`,`)
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
      await interaction.guild.members.cache.get(user.id).roles.remove(role);
      const embed = new EmbedBuilder()
        .setColor(role.color)
        .setDescription(
          `Succesfully removed role \`${role.name}\`from ${user} `
        )
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
        .setColor("DarkBlue")
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp()
        .setDescription(
          `Failed to remove role \`${role.name}\`from user \`${user.tag}\`.`
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
