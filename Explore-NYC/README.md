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

## Color Scheme

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#AD2B0B` | Backgrounds, cards |
| Accent | `#F04251` | Buttons, highlights |
| Card Light | `#65CDB6` | Event cards (even) |
| Card Dark | `#2D8B76` | Event cards (odd) |
| Background | `#EDEDEE` | Page background |
