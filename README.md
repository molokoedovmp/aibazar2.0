This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local catalog database

The local test database is an isolated Prisma Postgres server named
`aibazar-local`. Next.js uses the ignored `.env.local` file, so the remote
`DATABASE_URL` in `.env` is not changed.

```bash
npm run db:local:start
npm run db:local:status
npm run dev
```

The combined JSON dump can be re-imported with the following command. The
import clears and rebuilds the local database configured in `.env.local`.

```bash
npm run import:db
```

To fetch new entries from `collective-ai-tools` and merge only unseen names and
URLs into the dump:

```bash
npm run catalog:merge:collective
```

Download and cache missing catalog covers from each tool's official website:

```bash
npm run catalog:images
```

Translate descriptions that do not yet contain Russian text:

```bash
npm run catalog:translate:ru
```

The translator checkpoints the JSON after every small batch and skips
descriptions that are already in Russian.

The image importer prefers Open Graph covers, falls back to website icons,
converts downloads to compact WebP files in `public/tool-images`, and skips
tools that already have a `coverImage`.

Tools without a usable cover are displayed with their name centered on a
deterministic gradient generated from that name. Broken external image URLs
use the same fallback in the browser.

## Deploying the catalog

Static images are included in the deployment from `public`, but the JSON dump
is not imported into the production database by a regular Next.js build. Use
the deployment build command below with the production `DATABASE_URL`:

```bash
npm run build:deploy
```

This adds missing AI tools, synchronizes their category assignments, and
removes only empty legacy categories replaced by the Russian taxonomy. It does
not clear the database and does not delete or overwrite users or orders. A
regular `npm run build` still builds without changing the database.

Stop the isolated database when it is no longer needed:

```bash
npm run db:local:stop
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
