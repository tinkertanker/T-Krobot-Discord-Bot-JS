# AGENTS.md

## Repository

This is the TinkerTanker trainer/community Discord bot. It is a CommonJS
Discord.js application with slash commands under `commands/`, event handlers
under `events/`, and direct Notion and short.io integrations.

## Development rules

- Use Node.js 22 and `npm ci`.
- Keep the existing CommonJS command/event structure unless a change requires
  a broader migration.
- Never commit `config.json`, `.env` files, tokens, API keys, certificates, or
  production Discord IDs that are not already intentionally public.
- Do not log full Discord user objects or upstream responses containing
  credentials or personal information.
- Administrative or destructive commands must declare appropriate default
  Discord permissions and must not rely only on channel visibility.
- A command that performs network or Discord mutations should acknowledge the
  interaction before Discord's three-second deadline, normally with
  `deferReply`, and must produce exactly one initial reply.
- Await asynchronous Discord mutations. Do not use `await collection.forEach`
  or leave promises unhandled.
- Button handlers must authorize the clicking member, prevent duplicate
  handling, remove or disable components when complete, and clean up retained
  state when collectors end.

## Validation

Run before committing:

```sh
npm ci --ignore-scripts
npm test
npm audit
for file in index.js deploy-commands.js notion.js shorten.js events/*.js commands/*/*.js test/*.js; do
  node --check "$file"
done
docker compose config --quiet
git diff --check
```

The production dependency audit must remain at zero known vulnerabilities.

## Slash commands

Changing a command definition does not update Discord automatically. Register
definitions in a test guild during development and in production during the
deployment procedure:

```sh
node deploy-commands.js
```

Do not run this without confirming that `config.json` targets the intended
guild.

## Production deployment

Production is hosted at:

```text
tinkertanker@dev.tk.sg:/home/tinkertanker-server/Docker/T-Krobot-Discord-Bot-JS
```

Follow `docs/deployment.md`. The mandatory sequence is:

1. inspect Git and container state;
2. back up `config.json` and deployment metadata;
3. retain and tag the currently running image;
4. build and validate the new image while the old bot remains online;
5. refresh slash commands;
6. stop, but do not delete, the old container;
7. start the new `bot` service;
8. verify zero restarts, the Discord-ready log, guild membership, command
   registration, and real `/ping` behavior; and
9. roll back immediately if verification fails.

Never allow both the legacy `server` container and current `bot` container to
run simultaneously. Do not use `docker compose up --remove-orphans` until the
new deployment has been proven healthy and the rollback retention period has
passed. Do not run broad Docker prune commands on the shared host.

## Secrets and rollback images

`config.json` is mounted read-only and should be mode `600`. The Docker build
context must continue to exclude it. Historical images may contain secrets;
keep rollback image access restricted and rotate credentials if exposure is
possible.

## GitHub reviews

For GitHub reviews, source `DEVIN_API_KEY` from `~/.secrets`, resolve the
organization via `GET https://api.devin.ai/v3/self`, then trigger and poll Devin
Review through `/v3/organizations/{org_id}/pr-reviews`. Do not wait
indefinitely on GitHub status alone. Never print the API key.

When addressing automated review feedback, validate each finding against the
code before changing it. Reply to and resolve each reviewed thread, rerun only
reviewers that found actionable issues, and merge only with passing checks and
no unresolved valid findings.
