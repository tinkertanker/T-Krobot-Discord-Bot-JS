const { 
    SlashCommandBuilder, 
    PermissionFlagBits,
    bold, 
    italic, 
    underscore,
} = require("discord.js");
const { execute } = require("./createnotion");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("Call for Instructors")
        .setDescription("Posts a call for instructors notice with various details included. Creates an accompanying thread.")
        .setDefaultMemberPermissions(PermissionFlagBits.Administrator)
        .addStringOption( option => 
            option
                .setName("title")
                .setDescription("Add name of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("details")
                .setDescription("Add any necessary details")
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
            ),

    async execute(interaction) {
        const { options } = interaction;
        const className = options.getString("title");
        const classDetails = options.getString("details") ?? "No specific details have been provided.";
        const classTime = options.getString("when"); 
        const classLocation = options.getString("where");
        const classManpower = options.getString("who"); 

        const reply = await interaction.reply ({
            content: `${underscore(bold("CFI" + className))}
            ---
            ${underscore("Details: ")}
            ${classDetails}
            ---
            ${underscore("Key Information: ")}
            ${italic("- When: ") + classTime}
            ${italic("- Where: ") + classLocation}
            ${italic("- No. of instructors needed: ") + classManpower}`, 
            fetchReply: true,
        });
        
        try {
            await reply.createThread({
                name: `CFI: ${className}`, 
                autoArchiveDuration: ThreadAutoArchiveDuration.OneDay, 
            });
            await interaction.followUp({ content: "Your thread has been successfully created", ephermal: true});
            console.log("Created thread");
        } catch (error) {
            console.log(role);
            console.error(error);
            interaction.reply({
              content: "An error occurred while creating the accompanying thread.",
              ephermal: true,
            });
        }
    }
}