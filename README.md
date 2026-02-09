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

Member data is loaded in from `./data/*.csv` and processed via Claude and output as JSON into `./src/shared/stats/*.json`. 

Instructions:

1. Use [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) to export:
  * `#reception` channel -> `./data/reception.csv`
  * `#discussion` channel -> `./data/discussion.csv`
2. Run `bun run scripts/crunchDataWithAi.ts`
3. Check that `reception.json` and `discussion.json` both exist.

_Note: `./src/shared/stats/*.json` is checked into git since the data doesn't change each day and it must be run manually._

## Deployment

The [Docker Build & Push](https://github.com/hiddentao/nspulse/actions/workflows/docker.yml) workflow auto-runs on `main` branch pushes, building the [`nspulse` image](https://github.com/hiddentao/nspulse/pkgs/container/nspulse). This then gets deployed to DigitalOcean.


## License

MIT — see [LICENSE.md](./LICENSE.md)
