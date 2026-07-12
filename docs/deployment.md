# Production deployment runbook

This bot is deployed on the shared Docker host. It does not expose an HTTP
service; health is determined through the container state, Discord gateway
login, and Discord API.

## Production location

```text
Host:      tinkertanker@dev.tk.sg
Directory: /home/tinkertanker-server/Docker/T-Krobot-Discord-Bot-JS
Service:   bot
Container: t-krobot-discord-bot-js-bot-1
```

The Compose project previously used a service named `server`. Never allow the
old `server` container and new `bot` container to run together, because both
would log in with the same Discord token and handle the same interactions.

## Configuration

Production configuration lives at `config.json` in the deployment directory.
It is excluded from Git and Docker build context and mounted read-only at
`/usr/src/app/config.json`.

Required keys:

- `clientId`
- `guildId`
- `token`
- `notionKey`
- `shortIoKey`
- `verificationChannel`
- `trainerRole`
- `tinkertankerRole`
- `pmCategory`

The host account and the container's `node` account both use UID 1000. Keep the
file owned by the deployment user and restricted:

```sh
chmod 600 config.json
```

Never print, copy into logs, commit, or bake the contents into an image. Rotate
the Discord, Notion, and short.io credentials if an old image may have included
them.

## Prepare a rollback

Connect and enter the deployment directory:

```sh
ssh tinkertanker@dev.tk.sg
cd /home/tinkertanker-server/Docker/T-Krobot-Discord-Bot-JS
```

Confirm the checkout is clean and identify the running container:

```sh
git status -sb
docker compose ps
docker ps -a --format '{{.Names}} | {{.Image}} | {{.Status}}' | grep -i krobot
```

Before updating, create an owner-only backup directory, preserve the
configuration and deployment files, record the commit, inspect the current
container, and tag its image. Replace the timestamp below with the current
deployment timestamp:

```sh
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="../T-Krobot-Discord-Bot-JS.rollback-$TS"
mkdir -m 700 "$BACKUP"
cp -p config.json compose.yaml Dockerfile package.json package-lock.json "$BACKUP"/
git rev-parse HEAD > "$BACKUP/commit"

OLD_CONTAINER=$(docker ps -q --filter name=t-krobot-discord-bot-js)
OLD_IMAGE=$(docker inspect -f '{{.Image}}' "$OLD_CONTAINER")
docker tag "$OLD_IMAGE" "t-krobot-discord-bot-js:rollback-$TS"
docker inspect "$OLD_CONTAINER" > "$BACKUP/container-inspect.json"
```

Record `$BACKUP`, `$OLD_CONTAINER`, and the rollback image name in the
deployment notes. Do not remove the old container during cutover.

## Build without downtime

The existing container uses its already-built image, so the checkout and new
image can be updated while it remains online:

```sh
git pull --ff-only origin main
chmod 600 config.json
docker compose build --pull bot
```

Validate the mounted configuration without displaying values:

```sh
docker compose run --rm --no-deps bot node -e '
const c = require("./config.json");
const required = [
  "clientId", "guildId", "token", "notionKey", "shortIoKey",
  "verificationChannel", "trainerRole", "tinkertankerRole", "pmCategory"
];
const missing = required.filter((key) => !c[key]);
if (missing.length) throw new Error(`Missing config keys: ${missing.join(", ")}`);
console.log("Config readable and complete");
'
```

## Register commands

Refresh guild commands before cutover. This is safe while the old bot remains
online and must be repeated whenever command definitions change:

```sh
docker compose run --rm --no-deps bot node deploy-commands.js
```

Expected result:

```text
Started refreshing 18 application (/) commands.
Successfully reloaded 18 application (/) commands.
```

## Cut over

Stop the old container but retain it for rollback. Its exact name may be the
legacy `t-krobot-discord-bot-js-server-1`:

```sh
docker stop t-krobot-discord-bot-js-server-1
docker compose up -d --no-build bot
```

Do not use `--remove-orphans` yet. That would delete the retained rollback
container.

## Verify

Check process state and logs immediately:

```sh
docker compose ps
docker inspect -f 'state={{.State.Status}} restarts={{.RestartCount}}' \
  t-krobot-discord-bot-js-bot-1
docker compose logs --tail=100 bot
```

Required ready signal:

```text
Ready! Logged in as TKTrainers Bot#9903
```

Confirm resource usage and ensure that only one bot container is running:

```sh
docker stats --no-stream t-krobot-discord-bot-js-bot-1
docker ps --format '{{.Names}} | {{.Status}}' | grep -i krobot
```

Also verify in Discord that TKTrainers Bot is online and run `/ping`. Expected
response:

```text
Pong!
```

Leave the new process running for several minutes and confirm that its restart
count remains zero and logs contain no exceptions or unhandled rejections.

## Roll back

If the new container crashes, fails to log in, fails command checks, or behaves
incorrectly in Discord, restore service immediately:

```sh
cd /home/tinkertanker-server/Docker/T-Krobot-Discord-Bot-JS
docker compose stop bot
docker start t-krobot-discord-bot-js-server-1
docker logs --tail=100 t-krobot-discord-bot-js-server-1
```

If the old container has already been removed, use the tagged rollback image
and the saved deployment files in the timestamped rollback directory. Restore
only after reviewing the saved commit and Compose definition; the old image may
contain the historical `config.json`, so it must remain private and should only
be used for emergency recovery.

## Cleanup

After the new version has survived normal use for several days:

```sh
docker rm t-krobot-discord-bot-js-server-1
docker image ls 't-krobot-discord-bot-js' --format '{{.Repository}}:{{.Tag}} {{.ID}}'
```

Remove a rollback image or backup only after confirming a newer known-good
rollback exists. Do not run broad Docker pruning commands on the shared host.

## July 2026 deployment record

The security-hardened deployment was cut over successfully on 12 July 2026.
At cutover:

- the new container logged in as `TKTrainers Bot#9903`;
- Discord guild membership was confirmed;
- all 18 commands were registered;
- restart count remained zero;
- runtime logs contained no errors; and
- the old `server` container was retained in a stopped state.

Rollback assets created for that deployment:

```text
/home/tinkertanker-server/Docker/T-Krobot-Discord-Bot-JS.rollback-20260712-091406
t-krobot-discord-bot-js:rollback-20260712-091406
t-krobot-discord-bot-js-server-1 (stopped)
```
