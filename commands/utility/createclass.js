const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  GuildCategory,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("create")
    .setDescription("Creates a new class channel and voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(option =>
      option.setName("channeltype")
      .setRequired(true)
      .setDescription("Set the type of Channel"
      .addChoices(
        {name: "Text channel", value :"textchannel"},
        {name: "Voice channel", value: "voicechannel"}
        )
        )
      .addStringOption(option =>
        option.setName("channelname")
        .setDescription("Set the name of the channel")
        .setRequired(true)
        )
      .addChannelOption (option =>
        option.setName("parent")
        .setDescription("Set the parent of the channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
        )  
      .addRoleOption(option=>
        option.setName("permission-role")
        .setDescription("The permission role of the channel")
        .setRequired(true)
        )  
        .addRoleOption(option=>
          option.setName("everyone")
          .setDescription("Tag @everyone")
          .setRequired(true)
          ),
//async?? I dunno how to fix this
           execute(interaction) {
            const{guild, member, options} = interaction;
            const {ViewChannel, ReadMessageHistory, SendMessages, Connect, Speak} = PermissionFlagsBits;
            const channeltype = optiions.getString("channeltype")
            const channelname = options.getString("channelname")
            const parent = options.getChannel ("parent")
            const permissions = options.getRole("permissions-role")
            const everyone = options.getRole("everyone")

            if (channeltype === "textchannel"){
              await guild.channels.create({
                name:`${channelname}`,
                type:ChannelType.GuildText,
                parent:parent,
                permissionOverwrites: [
                  {
                    id:permissions
                    allow: [ViewChannel,SendMessages,ReadMessageHistory],
                  },
                  {
                    id:everyone,
                    deny:[ViewChannel,SendMessages,ReadMessageHistory],
                  },
                ]              
              })

            }
            if (channeltype ==="voicechannel"){
              await guild.channels.create({
                name:`${channelname}`,
                type:ChannelType.GuildText,
                parent:parent,
                permissionOverwrites: [
                  {
                    id:permissions
                    allow: [ViewChannel,Connect,Speak],
                  },
                  {
                    id:everyone,
                    deny:[ViewChannel,Connect,Speak],
                  },
                ]              
              })

          }
        }
        await interaction.reply({content:"The channel has been created", ephermal: true})
      )
}
