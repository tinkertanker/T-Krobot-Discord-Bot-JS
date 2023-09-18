const { notionKey } = require("./config.json");

function createNotionPage(name, discordInfo) {
  const databaseId = "33ef76c1722149e38b5c76eaee799dd8";
  const url = "https://api.notion.com/v1/pages";

  const requestBody = {
    parent: {
      database_id: databaseId,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: name,
            },
          },
        ],
      },
      Active: {
        checkbox: true,
      },
      DiscordInfo: {
        rich_text: [
          {
            text: {
              content: discordInfo,
            },
          },
        ],
      },
    },
  };

  return fetch(url, {
    method: "POST",
    headers: {
      "Notion-Version": "2022-06-28",
      Authorization: `Bearer ${notionKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  }).then((response) => response.json());
}

module.exports = createNotionPage;
