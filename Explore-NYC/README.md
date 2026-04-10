# Explore NYC

**Explore NYC** is a web application that helps users discover local events, pop-ups, and hidden gems in New York City — tailored to their personal preferences through a short questionnaire and an AI-powered recommendation system.

## About the Project

Built for the **GDG CityTech Solution Challenger 2026**, Explore NYC targets:

- Tourists visiting New York City
- Locals looking for something fun to do
- Groups of friends planning an outing

### How it works

1. **Questionnaire** — Users answer 4 short questions about their vibe, group type, interests, and budget.
2. **Filter** — Optionally filter results by date and time.
3. **Results** — Events are scored and ranked by relevance using a recommendation engine, then displayed in a browsable card grid.
4. **Event Detail** — Tap any card to see full details, set a reminder, or visit the event link.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | TailwindCSS v4 |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | Firestore *(placeholder — add your credentials)* |
| AI | Vertex AI / Gemini *(placeholder — add your credentials)* |
| Analytics | BigQuery *(placeholder — add your credentials)* |

### Project Structure

```
Explore-NYC/          ← Frontend (React + Vite)
  src/
    home/             ← Start screen
    questionary/      ← 4-step questionnaire flow
    filter/           ← Date & time filter screen
    results/          ← Event results grid
    components/       ← EventCard, EventDetail (modal)
    data/             ← Mock event dataset (10 events)
    utils/            ← Recommendation scoring logic
    types/            ← TypeScript interfaces

backend/              ← Backend (Node.js + Express)
  routes/
    events.js         ← GET /api/events
    recommendations.js← POST /api/recommendations (Vertex AI placeholder)
  data/
    events.json       ← Sample event dataset
```

---

## Important — How to Run

### Frontend

```bash
cd "c:\Users\[your account]\Google Solution Challenger\try1\GDG-CityTech-SolutionChallenger-2026\Explore-NYC"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend

```bash
cd "c:\Users\[your account]\Google Solution Challenger\try1\GDG-CityTech-SolutionChallenger-2026\backend"
npm install
npm start
```

API runs on [http://localhost:3001](http://localhost:3001).

---

## Google Cloud Integration (Coming Soon)

The following placeholders are ready in the code — add your project credentials to activate them:

- **Firestore** — store events and user preferences (`backend/server.js`)
- **Vertex AI** — AI-powered event recommendations (`backend/routes/recommendations.js`)
- **BigQuery** — analytics and trend detection (`backend/server.js`)

---

## Color Scheme

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#AD2B0B` | Backgrounds, cards |
| Accent | `#F04251` | Buttons, highlights |
| Card Light | `#65CDB6` | Event cards (even) |
| Card Dark | `#2D8B76` | Event cards (odd) |
| Background | `#EDEDEE` | Page background |
