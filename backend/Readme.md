# Explore NYC — Backend API

Express.js REST API powering the Explore NYC application. Reads event data from **Google Firestore** and exposes endpoints for event listing, filtering, and AI-scored recommendations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM modules) |
| Framework | Express 4 |
| Database | Google Firestore (via Firebase Admin SDK) |
| Auth | Firebase service account (no user auth yet) |
| Config | dotenv |

---

## Project Structure

```
backend/
├── server.js                  # Entry point — Express app + route mounting
├── package.json
├── .env                       # Secret config (NOT committed)
├── .env.example               # Template — copy this to .env
│
├── routes/
│   ├── events.js              # GET /api/events, GET /api/events/:id
│   └── recommendations.js     # POST /api/recommendations
│
├── services/
│   └── events.service.js      # Firestore query layer (queryEvents, getAllEvents, getEventById)
│
├── database/
│   ├── firestore.js           # Firebase Admin SDK initialisation — exports `db`
│   ├── seed.js                # One-time seed script: uploads events.json → Firestore
│   └── schemas/
│       ├── event.schema.js    # Event document shape + validateEvent()
│       ├── business.schema.js # Business document shape
│       └── review.schema.js   # Review document shape
│
├── data/
│   └── events.json            # Local event dataset (source of truth for seeding)
│
├── ai/
│   └── gemini.service.js      # Placeholder — Gemini API integration (future)
│
├── jobs/
│   └── scheduler.js           # Placeholder — scheduled jobs (future)
│
└── processors/                # Placeholder — data processors (future)
```

---

## Setup

### 1. Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled
- A Firebase Admin SDK service account JSON

### 2. Get Firebase credentials

1. Open [Firebase Console](https://console.firebase.google.com) → your project
2. Go to **Project Settings → Service Accounts**
3. Click **Generate new private key** — download the JSON file
4. Place the JSON file inside `backend/database/`

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./database/YOUR-FILE-adminsdk-XXXXX.json
FIREBASE_PROJECT_ID=your-firebase-project-id
PORT=3001
```

> **Never commit `.env` or the credential JSON.** Both are listed in `.gitignore`.

### 4. Install dependencies

```bash
npm install
```

### 5. Seed Firestore

Run once to upload `data/events.json` into the Firestore `events` collection:

```bash
npm run seed
```

Safe to re-run — uses `{ merge: true }` so existing documents are updated, not duplicated.

### 6. Start the server

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3001`.

---

## API Reference

### Health check

```
GET /api/health
```

**Response**
```json
{ "status": "ok", "service": "Explore NYC API" }
```

---

### List events

```
GET /api/events
```

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `search` | string | Full-text search across name, description, location, tags |
| `date` | string | Filter by exact date `YYYY-MM-DD` |
| `time` | string | Filter events starting at or after this time `HH:MM` |
| `category` | string | One of: `pop-up`, `educational`, `wellness`, `sports`, `festival`, `gaming` |
| `is_free` | boolean | `true` or `false` |

**Example**
```
GET /api/events?category=wellness&is_free=true
```

**Response**
```json
{
  "events": [
    {
      "id": "3",
      "name": "Central Park Morning Yoga",
      "date": "2026-05-18",
      "time": "08:00",
      "description": "Guided yoga session...",
      "category": "wellness",
      "is_free": true,
      "group_type": ["solo", "couple", "fitness"],
      "location": "Central Park, Manhattan, NY",
      "link": "https://example.com/central-park-yoga",
      "tags": ["yoga", "wellness", "fitness", "outdoor", "meditation", "health"]
    }
  ],
  "total": 1
}
```

---

### Get event by ID

```
GET /api/events/:id
```

**Response** — single event object, or `404` if not found.

---

### Get recommendations

```
POST /api/recommendations
Content-Type: application/json
```

**Request body**

```json
{
  "preferences": {
    "vibe": ["Wellness", "Outdoors"],
    "groupType": "Friends",
    "interests": ["yoga", "food"],
    "pricePreference": "free",
    "customInput": "looking for outdoor activities"
  }
}
```

| Field | Type | Values |
|---|---|---|
| `vibe` | string[] | `Outdoors`, `Food & Drinks`, `Arts & Culture`, `Sports & Fitness`, `Music & Entertainment`, `Shopping`, `Gaming & Tech`, `Wellness`, `Family Fun` |
| `groupType` | string | `Solo`, `Friends`, `Couple`, `Family` |
| `interests` | string[] | Free-form tags |
| `pricePreference` | string | `free`, `up20`, `up50`, `any` |
| `customInput` | string | Natural language input |

**Response** — same as event list, with an additional `relevanceScore` field on each event, sorted descending.

```json
{
  "events": [
    { "id": "3", "name": "Central Park Morning Yoga", "relevanceScore": 9, "..." : "..." }
  ],
  "total": 10
}
```

---

## Firestore Collections

### `events`

| Field | Type | Description |
|---|---|---|
| `id` | string | Document ID (mirrored into the document) |
| `name` | string | Event display name |
| `date` | string | `YYYY-MM-DD` |
| `time` | string | `HH:MM` 24-hour |
| `description` | string | Full description |
| `category` | string | Event category |
| `focus` | string | Target audience |
| `is_free` | boolean | Free entry |
| `min_price` | number? | Minimum price (omitted when free) |
| `max_price` | number? | Maximum price (omitted when free) |
| `group_type` | string[] | Audience tags |
| `location` | string | Venue and borough |
| `link` | string | External event URL |
| `tags` | string[] | Searchable keywords |
| `created_at` | number | Unix timestamp (ms) when seeded |

### `businesses` _(future)_

Stores local NYC businesses linked to events.

### `reviews` _(future)_

Stores user-submitted reviews referencing an `event_id`.

---

## Rate Limiting

All endpoints are protected by `express-rate-limit` to prevent abuse and keep Firestore costs under control.

| Scope | Limit | Window |
|---|---|---|
| All routes (global) | 100 requests | 15 minutes per IP |
| `POST /api/recommendations` | 20 requests | 15 minutes per IP |

`/api/recommendations` has a stricter limit because each call reads every event document from Firestore.

When the limit is exceeded the API returns:
```json
HTTP 429
{ "error": "Too many requests — please wait before trying again.", "retryAfter": "..." }
```

Configured in [config/rateLimiter.js](config/rateLimiter.js) — adjust `max` and `windowMs` there.

---

## Security

- `.env` and the Firebase credential JSON are listed in `.gitignore` and will never be committed.
- Use `.env.example` as the template — fill in real values locally, share only the example file.
- If a credential is ever accidentally committed, immediately rotate the key in Firebase Console → Service Accounts.
- The server only accepts requests from `http://localhost:5173` (frontend dev origin) via CORS. Update `server.js` for production origins.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start server with auto-restart (`node --watch`) |
| `npm start` | Start server (production) |
| `npm run seed` | Upload `data/events.json` into Firestore |
