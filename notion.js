//const fetch = require('node-fetch');
const { notionKey } = require("./config.json");

function createNotionPage(name, discordInfo) {
  // The class database has multiple data sources; write to the main one
  // ("Classes for TKtrainers database"). Multi-source databases require
  // Notion-Version >= 2025-09-03 and a data_source_id parent.
  const dataSourceId = "e5451886-30b8-41b7-94e8-1991240255fe";
  const url = "https://api.notion.com/v1/pages";

  const requestBody = {
    parent: {
      data_source_id: dataSourceId,
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
      "Notion-Version": "2025-09-03",
      Authorization: `Bearer ${notionKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  }).then((response) => response.json());
}

module.exports = createNotionPage;
