# Explore NYC — Frontend

React + TypeScript frontend for the Explore NYC application. Presents a guided questionnaire, filters, and a ranked event results grid.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | TailwindCSS v4 |
| Routing | React Router v7 |
| PDF export | jsPDF |

---

## Project Structure

```
Explore-NYC/
├── public/
└── src/
    ├── home/            ← Start screen
    ├── questionary/     ← 4-step questionnaire flow
    ├── filter/          ← Date & time filter screen
    ├── results/         ← Event results grid
    ├── components/      ← EventCard, EventDetail modal
    ├── data/            ← Local mock event dataset
    ├── utils/           ← Recommendation scoring logic
    └── types/           ← TypeScript interfaces
```

---

## Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **Backend running** on `http://localhost:3001` — see [`backend/Readme.md`](../backend/Readme.md)

---

## Setup & Run

### 1. Install dependencies

```bash
cd Explore-NYC
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> The backend must be running first. See [`backend/Readme.md`](../backend/Readme.md) for setup.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload at `http://localhost:5173` |
| `npm run build` | Type-check and build for production (output: `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across all source files |

---

## Color Scheme

| Token | Hex | Usage |
|---|---|---|
| Primary | `#AD2B0B` | Backgrounds, cards |
| Accent | `#F04251` | Buttons, highlights |
| Card Light | `#65CDB6` | Event cards (even) |
| Card Dark | `#2D8B76` | Event cards (odd) |
| Background | `#EDEDEE` | Page background |
