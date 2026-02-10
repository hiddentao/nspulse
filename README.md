# NS Pulse

![NS Pulse screenshot](https://raw.githubusercontent.com/hiddentao/nspulse/refs/heads/main/screenshot.png "NS Pulse Screenshot")

**Live site: https://nspulse.xyz**

Stats dashboard for [NS](https://ns.com), including info on monthly events, member countries and talents. Built using [QuickDapp](https://quickdapp.xyz).

## Getting Started

Requires: 
* [Node.js](https://nodejs.org)
* [Bun](https://bun.com)
* [Docker](https://docker.com)

Install dependencies

```bash
bun i
```


Start the database server in a separate terminal:

```bash
docker compose up --build
```

Setup database schema:

```bash
bun run db push
```

Get an [Anthropic API key](https://www.anthropic.com/learn/build-with-claude) and place it in `.env.local`:

```
ANTHROPIC_API_KEY=
```

Run the dev server:

```bash
bun run dev
```

Hot-module reload is now enabled (except for changes to `.env` files). Access the site at [http://localhost:5173](http://localhost:5173)

## Data sources

### Events

Event data is fetched directly from the [NS calendar](https://luman.com/ns) and then processed via Claude.

### Members

1. Use [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) to export:
  * `#reception` channel -> `./data/reception.csv`
2. Run `bun run scripts/parseReceptionCsv.ts`
3. Check that `./src/shared/stats/reception.json` exists.

_Note: If the script fails halfway you can re-run it and it will resume from where it left off. To force a fresh run delete the `.parseReception.progress` file in the root folder._

### Ideas

1. Use [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) to export:
  * `#discussion` channel -> `./data/discussion.csv`
2. Run `bun run scripts/parseDiscussionCsv.ts`
3. Check that `./src/shared/stats/discussion.json` exists.

_Note: If the script fails halfway you can re-run it and it will resume from where it left off. To force a fresh run delete the `.parseDiscussion.progress` file in the root folder._

## Deployment

The [Docker Build & Push](https://github.com/hiddentao/nspulse/actions/workflows/docker.yml) workflow auto-runs on `main` branch pushes, building the [`nspulse` image](https://github.com/hiddentao/nspulse/pkgs/container/nspulse). This then gets deployed to DigitalOcean.


## License

MIT — see [LICENSE.md](./LICENSE.md)
