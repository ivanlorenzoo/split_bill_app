# Split Bill App

A lightweight, client-side web application for splitting shared bills among multiple people. Built with plain HTML, CSS, and Vanilla JavaScript — no framework, no backend, no build step required.

## Features

- **Participant management** — add up to 20 people per session, with duplicate and empty-name validation
- **Bill items** — record expenses with a name and price; edit or delete at any time
- **Drag and drop assignment** — drag participant cards onto bill items to assign who owes what; tap-based fallback for touch/mobile devices
- **Tax & tip** — enter percentages and the app distributes them proportionally across each participant's share
- **Live summary** — per-person totals update instantly as you make changes, with an item-level breakdown per participant
- **Rounding correctness** — uses the Largest Remainder Method to ensure the sum of all shares always equals the total bill exactly
- **Reset** — clear all data and start fresh with a confirmation prompt
- **Responsive** — works on screens from 320px (mobile) to 1920px (desktop)

## How It Works

```
User Action → Event Handler → State Mutation → Re-render UI
```

All state lives in browser memory. There is no server, no localStorage, and no persistence between page refreshes. Everything is calculated in real time from the current state.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES6+ modules) |
| Markup | HTML5 (semantic, ARIA attributes) |
| Styling | CSS3 — Grid, Flexbox, CSS Custom Properties |
| Drag & Drop | HTML5 Drag and Drop API + touch/tap fallback |
| Tests | Vitest + fast-check (property-based) + jsdom |

## Getting Started

No installation needed to run the app — it's plain static files.

**Option 1 — npx serve (recommended):**
```bash
cd split-bill-app
npx serve .
```

**Option 2 — Python HTTP server:**
```bash
cd split-bill-app
python -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

## Running Tests

```bash
cd split-bill-app
npm install
npm test
```

To run with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
split-bill-app/
├── index.html              # Entry point
├── style.css               # All styles and responsive layout
├── app.js                  # App bootstrap and wiring
├── state.js                # Centralized state + observer pattern
├── calculation.js          # Pure calculation functions
├── validation.js           # Input validation
├── dragdrop.js             # Drag-and-drop + tap fallback
├── render.js               # Top-level render(state)
└── components/
    ├── participantPanel.js
    ├── billPanel.js
    ├── taxTipPanel.js
    └── summaryPanel.js
```

## Deployment

The app is deployed automatically via GitHub Actions on every push to `main`. The pipeline runs tests first, and only deploys if they pass. Static files are synced to the server over SSH using `rsync`.

## License

MIT
