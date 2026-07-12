# T-Krobot Discord Bot

A Discord.js bot for TinkerTanker community administration. It provides slash
commands for trainer verification, class channels, instructor calls, roles,
Notion pages, and short links.

## Requirements

- Node.js 22
- A Discord application and test guild
- A Notion integration and short.io account for commands that use them

## Local setup

Install the locked dependencies:

```sh
npm ci
```

Copy `configTemplate.json` to `config.json` and replace every placeholder with
the IDs and credentials for your test environment. `config.json` is ignored by
Git and Docker; never commit it or add it to an image.

Restrict the file to your user on Unix-like systems when running the bot
directly:

```sh
chmod 600 config.json
```

Register the guild slash commands after initial setup and whenever command
definitions change:

```sh
node deploy-commands.js
```

Then start the bot:

```sh
npm start
```

The Discord bot must have the Server Members privileged intent enabled and the
permissions needed by the administrative commands. Its role must be above roles
that it assigns or removes.

## Docker Compose

Create `config.json` on the host as described above, then run:

```sh
docker compose up --build -d
docker compose logs -f bot
```

Compose bind-mounts `config.json` read-only at runtime, so it is not stored in
an image layer. The service exposes no HTTP port; it connects outbound to
Discord and the configured integrations. Compose also limits memory, CPU, and
process count, and rotates container logs.

The container runs as UID 1000. On Linux, ensure that UID can read the bind
mount—for example, make UID 1000 the file owner and keep mode `600`, or grant
that UID a read ACL. Do not make the credential file world-readable. Docker
Desktop handles bind-mount permissions through its file-sharing layer.

When deploying from a different directory, keep the configuration outside the
repository and change the bind mount's `source` to its absolute host path. Make
sure the container's `node` user can read the file while no unrelated host users
can. Rebuild regularly to pick up patched Node 22 Alpine base images:

```sh
docker compose build --pull
docker compose up -d
```

Use a test guild before production. If a credential may have been included in
an old image or exposed elsewhere, rotate it with Discord, Notion, or short.io;
do not merely replace the local file.

## Production deployment

Production runs with Docker Compose on `tinkertanker@dev.tk.sg` from:

```text
/home/tinkertanker-server/Docker/T-Krobot-Discord-Bot-JS
```

Do not deploy with a blind `git pull && docker compose up`. The Compose service
was renamed from `server` to `bot` in July 2026, so an unmanaged cutover can
leave both versions connected to Discord. Follow the backup, command refresh,
cutover, verification, and rollback procedure in
[docs/deployment.md](docs/deployment.md).

The production bot has no HTTP health endpoint. A healthy deployment requires
all of the following:

- the `bot` container is running with zero restarts;
- logs contain `Ready! Logged in as TKTrainers Bot#9903`;
- the bot account is a member of the configured guild;
- all 18 guild slash commands are registered; and
- no old `server` container is running at the same time.

Keep the previous stopped container and tagged rollback image until the new
release has survived normal Discord usage for several days.
