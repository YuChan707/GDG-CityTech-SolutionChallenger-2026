# Explore NYC

**Explore NYC** is a web application that helps users discover local events, pop-ups, and hidden gems in New York City, tailored to their personal preferences through a short questionnaire and an AI-powered recommendation system.

## About the Project

Built for the **GDG CityTech Solution Challenger 2026**, Explore NYC targets:

- Tourists visiting New York City
- Locals looking for something fun to do
- Groups of friends planning an outing

### Features

- **Personalized Recommendations**: AI-driven suggestions based on user preferences
- **Local Focus**: Highlights events and businesses across all NYC boroughs (Manhattan, Brooklyn, Bronx, Queens, Staten Island)
- **Interactive Questionnaire**: Quick survey to match users with ideal experiences
- **Event Discovery**: Browse pop-ups, festivals, workshops, and more
- **Business Directory**: Explore local cafes, studios, markets, and services

### Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend  | React 19 + TypeScript + Vite |
| Styling   | TailwindCSS v4          |
| Routing   | React Router v6         |
| Backend   | Node.js + Express       |
| Database  | Firestore               |
| AI        | Vertex AI / Gemini      |
| Analytics | BigQuery                |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

#### Windows

##### Frontend

```bash
cd "c:\Users\[your account]\GDG-CityTech-SolutionChallenger-2026\Explore-NYC"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

##### Backend

```bash
cd "c:\Users\[your account]\GDG-CityTech-SolutionChallenger-2026\backend"
npm install
npm start
```

API runs on [http://localhost:3001](http://localhost:3001).

#### macOS

##### Frontend

```bash
cd "/Users/[your account]/GDG-CityTech-SolutionChallenger-2026/Explore-NYC"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

##### Backend

```bash
cd "/Users/[your account]/GDG-CityTech-SolutionChallenger-2026/backend"
npm install
npm start
```

API runs on [http://localhost:3001](http://localhost:3001).

## Google Cloud Integration (Coming Soon)

The following placeholders are ready in the code. Add your project credentials to activate them:

- **Firestore**: Store events and user preferences (`backend/server.js`)
- **Vertex AI**: AI-powered event recommendations (`backend/routes/recommendations.js`)
- **BigQuery**: Analytics and trend detection (`backend/server.js`)

## Data

The `default-data` folder contains fake data for testing the frontend. Replace with real data when integrating with Firestore.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.