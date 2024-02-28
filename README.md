# Developer Guide

## 1. Clone the Git Repo
## 2. Create config.json (it's gitignored)

Template below:

```js
{
    "clientId": "app_id",
    "guildId": "server_id",
    "token": "bot_token",
    "notionKey": "",
    "shortIoKey": "",
    "verificationChannel": "channel_id",
    "trainerRole": "role_id",
    "tinkertankerRole": "role_id",
    "pmCategory": "channel_id"
}
```

You can google for most of the first 3 items, the last 4 you have to manually find after creating the test / live server

## 3. Deploy commands

This has to be done everytime commands are edited, even on Production version

```js
node deploy-commands.js
```

## 4. Run the bot

```cpp
node index.js
```

## Production Config

It's in Notion    

## Glitch.com guide

Remember to put the following in package.json on glitch

```js
"engines": { "node": "16.x" },
"scripts": {
    "start": "node index.js"
},
```

If not deploy-commands.js will throw an error or it will die after 5 min

It should be on Glitch’s boosted plan and be up 24/7, no need weird pinging and stuff

## Server Template

https://discord.new/vtywrYdy6tgN (from YJ)