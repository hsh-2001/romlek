# Romlek Desktop

Electron desktop shell for the Romlek web app.

The app keeps desktop packaging separate from the Next.js website. It loads Romlek pages in an iframe, defaulting to `http://localhost:3000`.

## Development

Start the website first:

```bash
cd ../website
npm run dev
```

Then start Electron:

```bash
cd ../desktop
npm install
npm run dev
```

Use the "Web app URL" field in the desktop app to point at a deployed Romlek website when needed.

## Build

```bash
cd desktop
npm install
npm run build
```

Build output is written to `desktop/release`.
