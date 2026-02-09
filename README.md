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

Run the dev server:

```bash
bun run dev
```

Hot-module reload is now enabled (except for changes to `.env` files). Access the site at [http://localhost:5173](http://localhost:5173)

## Deployment

The [Docker Build & Push](https://github.com/hiddentao/nspulse/actions/workflows/docker.yml) workflow auto-runs on `main` branch pushes, building the [`nspulse` image](https://github.com/hiddentao/nspulse/pkgs/container/nspulse). This then gets deployed to DigitalOcean.


## License

MIT — see [LICENSE.md](./LICENSE.md)
