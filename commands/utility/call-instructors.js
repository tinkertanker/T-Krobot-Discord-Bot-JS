const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    bold, 
    underscore,
    EmbedBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("call-instructors")
        .setDescription("Posts a call for instructors notice with various details included. Creates an accompanying thread.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption( option => 
            option
                .setName("title")
                .setDescription("Add name of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("when")
                .setDescription("Add the time of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("where")
                .setDescription("Add the location of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("who")
                .setDescription("Add the number of instructors needed")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("what")
                .setDescription("Add any necessary details")
                .setRequired(true)
            )
        .addStringOption( option => 
            option 
                .setName("link")
                .setDescription("Add any relevant URL. Don't forget the https://")
            )
        .addAttachmentOption( option =>
            option
                .setName("image")
                .setDescription("Add any accompanying image reference.")
            ),

    async execute(interaction) {
        const { options } = interaction;
        const className = options.getString("title");
        const classDetails = options.getString("what") ?? "No specific details have been provided.";
        const classTime = options.getString("when").replace(/\\n/, "\n"); 
        const classLocation = options.getString("where");
        const classManpower = options.getString("who"); 
        const classURL = options.getString("link");
        let classImage = options.getAttachment("image") ?? "https://tinkercademy.com/wp-content/uploads/2019/03/01-Tinkercademy-Tertiary-Logo-Colour-On-Light-460w.png";
        const channel = interaction.channel ?? "Not a text channel";
      
        if (typeof(classImage) !== "string") {
          classImage = classImage.url
        }
        
        const replyEmbed = await new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(className)
            .setURL(classURL)
            .setDescription(classDetails)
            .addFields(
                { name: "Where", value: classLocation, inline: true },
                { name: "Who", value: classManpower, inline: true }, 
                { name: "When", value: classTime },
            )
            .setImage(classImage)
        
        const reply = await channel.send({ embeds: [replyEmbed] })
        
        try {
            await reply.startThread({
                  name: `CFI: ${className}`, 
                  autoArchiveDuration: 1440,
            });
            await interaction.reply({ content: "Your thread has been successfully created", ephemeral: true});
            await reply.react("✅");
        } catch(error) {
            console.error(error);
            interaction.followUp({
                content: "An error occurred while creating the accompanying thread.",
                ephemeral: true,
            });
        }
    }
}