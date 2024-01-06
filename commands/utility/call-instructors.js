const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    bold, 
    underscore,
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
                .setDescription("Add the date and time of the class")
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
                .setName("details")
                .setDescription("Add any necessary details")
            ),

    async execute(interaction) {
        const { options } = interaction;
        const className = options.getString("title");
        const classDetails = options.getString("details") ?? "No specific details have been provided.";
        const classTime = options.getString("when"); 
        const classLocation = options.getString("where");
        const classManpower = options.getString("who"); 

        const reply = await interaction.reply ({
            content: 
            `
${underscore(bold("CFI: " + className))}

${underscore("Details: ")}
${classDetails}

${underscore("Key Information: ")}
- When: ${classTime}
- Where: ${classLocation}
- No. of instructors needed: ${classManpower}

---
Note: a ✅ indicates that the CFI is open, and a ❌ indicates that the CFI is closed.`,
          fetchReply: true,
        });
              
        try {
            await reply.startThread({
                name: `CFI: ${className}`, 
                autoArchiveDuration: 1440,
            });
            await interaction.followUp({ content: "Your thread has been successfully created", ephemeral: true});
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