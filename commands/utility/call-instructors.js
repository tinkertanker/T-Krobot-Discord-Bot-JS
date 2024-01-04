const { 
    SlashCommandBuilder, 
    PermissionFlagBits,
    bold, 
    italic, 
    underscore, 
    quote, 
    blockQuote
} = require("discord.js");
const { execute } = require("./createnotion");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("Call for Instructors")
        .setDescription("Posts a call for instructors notice with various details included")
        .setDefaultMemberPermissions(PermissionFlagBits.Administrator)
        .addStringOption( option => 
            option
                .setName("Title")
                .setDescription("Add name of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("Details")
                .setDescription("Add any necessary details")
            )
        .addStringOption( option => 
            option
                .setName("When")
                .setDescription("Add the date and time of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("Where")
                .setDescription("Add the location of the class")
                .setRequired(true)
            )
        .addStringOption( option => 
            option
                .setName("Who")
                .setDescription("Add the number of instructors needed")
                .setRequired(true)
            ),

    async execute(interaction) {
        const { options } = interaction;
        const className = options.getString("Title");
        const classDetails = options.getString("Details") ?? "No specific details have been provided.";
        const classTime = options.getString("When"); 
        const classLocation = options.getString("Where");
        const classManpower = options.getString("Who"); 

        await interaction.reply (
            `${underscore(bold("CFI" + className))}
            ---
            ${underscore("Details: ")}
            ${classDetails}
            ---
            ${underscore("Key Information: ")}
            ${italic("- When: ") + classTime}
            ${italic("- Where: ") + classLocation}
            ${italic("- No. of instructors needed: ") + classManpower}`
        )
    }
}