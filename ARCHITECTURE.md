# Explore NYC — System Architecture

Full system architecture diagrams for the Explore NYC platform.

---

## 1. High-Level System Overview

```mermaid
C4Context
    title Explore NYC — System Context

    Person(user, "NYC Resident", "Discovers events, businesses, and opportunities")

    System(frontend, "Explore NYC Frontend", "React 19 SPA — questionnaire, results, education")
    System(backend, "Explore NYC Backend", "Express API — recommendations, pipeline, education")

    System_Ext(firestore, "Google Firestore", "NoSQL database — events, businesses, education")
    System_Ext(gemini, "Google Gemini 2.0 Flash", "AI content validation & ranking")
    System_Ext(apify, "Apify", "Web scraping — Google Search, Google Maps, Instagram")

    Rel(user, frontend, "Uses", "HTTPS / localhost:5173")
    Rel(frontend, backend, "API calls", "HTTP / localhost:3001")
    Rel(backend, firestore, "Read/Write", "Firebase Admin SDK")
    Rel(backend, gemini, "Validate & rank", "REST API")
    Rel(backend, apify, "Scrape", "Apify Client SDK")
```

---

## 2. Component Architecture

```mermaid
graph TB
    subgraph FE["Frontend — Explore-NYC/ (React 19 + Vite)"]
        direction TB
        StartScreen --> Questionnaire
        StartScreen --> EducationQuestionnaire
        Questionnaire --> ResultsPage
        EducationQuestionnaire --> EducationResults
        ResultsPage --> EventDetail
        ResultsPage --> FilterScreen
        ResultsPage --> PDFExport["exportToPDF"]
        EducationResults --> EduPDF["exportEducationPDF"]
        ResultsPage --> MapSection
        Header -.-> StartScreen
        apiFetch["api/backend.ts\napiFetch()"] -.-> ResultsPage
        apiFetch -.-> EducationResults
        scoreEvents["utils/recommendation.ts\nscoreEvents()"] -.-> ResultsPage
        scoreOrg["scoreOrg()"] -.-> EducationResults
    end

    subgraph BE["Backend — backend/ (Express 4)"]
        direction TB
        server["server.js\n:3001"] --> eventsRoute["routes/events.js"]
        server --> bizRoute["routes/businesses.js"]
        server --> recRoute["routes/recommendations.js"]
        server --> pipeRoute["routes/pipeline.js"]
        server --> pickRoute["routes/daily-pick.js"]
        server --> eduRoute["routes/education.js"]

        eventsRoute --> eventsService["services/events.service.js"]
        bizRoute --> eventsService
        recRoute --> eventsService
        pipeRoute --> demandPipeline["services/demand-pipeline.service.js"]
        pickRoute --> dailyPick["services/daily-pick.service.js"]
        eduRoute --> eduService["services/education.service.js"]

        scheduler["jobs/scheduler.js\nnode-cron every 6h"] --> pipeline["services/pipeline.service.js"]

        demandPipeline --> apifySearch["services/apify-search.service.js"]
        pipeline --> apifySearch
        dailyPick --> apifySearch

        demandPipeline --> geminiSvc["ai/gemini.service.js"]
        pipeline --> geminiSvc
        dailyPick --> geminiSvc

        pipeline --> filterProc["processors/filter.processor.js"]
        pipeline --> eventProc["processors/event.processor.js"]
        pipeline --> matchProc["processors/matcher.processor.js"]

        rateLimiter["config/rateLimiter.js"] -.-> server
        helmet["helmet"] -.-> server
        cors["cors"] -.-> server
    end

    subgraph DATA["Data Layer"]
        Firestore_events[(events)]
        Firestore_biz[(businesses)]
        Firestore_picks[(daily_picks)]
        Firestore_edu[(professional_events\njobs_internships)]
    end

    subgraph EXT["External Services"]
        Gemini["Google Gemini 2.0 Flash"]
        ApifyG["Apify Google Search"]
        ApifyM["Apify Google Maps"]
        ApifyI["Apify Instagram"]
    end

    FE -->|HTTP /api/*| BE
    eventsService --> Firestore_events
    eventsService --> Firestore_biz
    dailyPick --> Firestore_picks
    eduService --> Firestore_edu
    demandPipeline -->|save new| Firestore_events
    demandPipeline -->|save new| Firestore_biz
    pipeline -->|save new| Firestore_events

    geminiSvc --> Gemini
    apifySearch --> ApifyG
    apifySearch --> ApifyM
    apifySearch --> ApifyI
```

---

## 3. NYC Explorer Data Flow

```mermaid
sequenceDiagram
    actor User
    participant Q as Questionnaire
    participant FE as ResultsPage
    participant BE as Express API
    participant DB as Firestore
    participant AI as Gemini
    participant Scraper as Apify

    User->>Q: 5-step form (vibe, group, interests, budget)
    Q->>BE: POST /api/pipeline/trigger {preferences}
    BE-->>Q: 200 OK (immediate — pipeline runs in background)
    Q->>FE: navigate("/results")

    par Fetch results
        FE->>BE: GET /api/events
        FE->>BE: GET /api/businesses
        FE->>BE: POST /api/recommendations {preferences}
    end

    BE->>DB: Query events + businesses collections
    DB-->>BE: Documents
    BE-->>FE: Scored & ranked results
    FE-->>User: 8-per-page grid (spinner during load)

    Note over BE,Scraper: Background pipeline (fire-and-forget)
    BE->>Scraper: Google Search — "NYC events {vibe} 2026"
    Scraper-->>BE: 10 web snippets
    BE->>Scraper: Google Maps — "{vibe} in New York City"
    Scraper-->>BE: 10 places
    BE->>AI: rankResultsForUser(top 20, preferences)
    AI-->>BE: Relevance scores 0-10
    BE->>AI: validateLegitimacyBatch(top 5 events + top 5 businesses)
    AI-->>BE: is_legitimate flags
    BE->>DB: Save up to 5 new events + 5 new businesses\n(dedup by slug, skip if exists)
```

---

## 4. High Education Data Flow

```mermaid
sequenceDiagram
    actor User
    participant Q as EducationQuestionnaire
    participant FE as EducationResults
    participant BE as Express API
    participant DB as Firestore

    User->>Q: Step 1 — Looking for? (Events/Jobs/Both)
    User->>Q: Step 2 — Who are you? (HS/College/No Degree)
    User->>Q: Step 3 — Focus area? (10 options)
    User->>Q: Step 4 — Experience level?
    User->>Q: Step 5 — Optional keyword
    Q->>FE: navigate with serialized preferences

    alt Backend enabled
        FE->>BE: POST /api/education/recommendations {preferences}
        BE->>DB: Query professional_events + jobs_internships
        DB-->>BE: Education documents
        BE-->>FE: Sorted by relevanceScore
    else Client-side fallback
        FE->>FE: scoreOrg() on static educationProfiles.ts
    end

    FE-->>User: Color-coded org cards (sorted by score)
    User->>FE: Click card → modal with Apply/Register link
    User->>FE: Export → PDF
```

---

## 5. Pipeline Architecture

```mermaid
graph TB
    subgraph Triggers["Pipeline Triggers"]
        T1["User submits questionnaire\nPOST /api/pipeline/trigger"]
        T2["node-cron\n0 */6 * * *\nevery 6 hours"]
        T3["GET /api/daily-pick\n(cache miss)"]
    end

    subgraph DemandPipeline["Demand Pipeline\ndemand-pipeline.service.js"]
        D1[searchEvents\nApify Google Search]
        D2[searchBusinesses\nApify Google Maps]
        D3[rankResultsForUser\nGemini 2.0 Flash]
        D4[validateLegitimacyBatch\nGemini 2.0 Flash]
        D5[saveNewEvents\nmax 5, dedup by slug]
        D6[saveNewBusinesses\nmax 5, dedup by slug]
        D1 --> D3
        D2 --> D3
        D3 --> D4
        D4 --> D5 & D6
    end

    subgraph ScheduledPipeline["Scheduled Pipeline\npipeline.service.js"]
        S1[Apify Instagram\nhashtag dataset]
        S2[Apify Google Search\n& Maps]
        S3[filter.processor\nisRelevant]
        S4[gemini.service\nstructureSearchResult]
        S5[event.processor\nnormalizeEvent]
        S6[matcher.processor\nmatchToExisting]
        S7[saveEvent\n3-5 per run]
        S1 & S2 --> S3 --> S4 --> S5 --> S6 --> S7
    end

    subgraph DailyPick["Daily Pick\ndaily-pick.service.js"]
        P1{Cache hit\ndaily_picks/YYYY-MM-DD?}
        P2[Apify Instagram\n1 post]
        P3[Gemini\n1 classifyContent call]
        P4[matcher.processor\nmatchToExisting]
        P5[Cache in Firestore\ndaily_picks/YYYY-MM-DD]
        P1 -->|Hit| POut[Return cached pick]
        P1 -->|Miss| P2 --> P3 --> P4 --> P5
    end

    T1 --> DemandPipeline
    T2 --> ScheduledPipeline
    T3 --> DailyPick

    DemandPipeline -->|Write| Firestore_E[(events)]
    DemandPipeline -->|Write| Firestore_B[(businesses)]
    ScheduledPipeline -->|Write| Firestore_E
    DailyPick -->|Write| Firestore_D[(daily_picks)]
```

---

## 6. Firestore Data Model

```mermaid
erDiagram
    events {
        string id PK "name-date slug"
        string title
        string description
        string date "YYYY-MM-DD"
        string time "HH:MM"
        string category
        boolean is_free
        number min_price
        number max_price
        string location
        object coordinates
        string link
        array tags
        array group_type
        boolean is_legitimate
        boolean gemini_checked
        string experience_type
        string source
        timestamp addedAt
    }

    businesses {
        string id PK "name-slug"
        string name
        string description
        string hours
        string location
        object coordinates
        string category
        string link
        number rating
        boolean is_active
        string source
    }

    daily_picks {
        string id PK "YYYY-MM-DD"
        string date_picked
        string type "event or business"
        boolean matched_existing
        string matched_source
    }

    professional_events {
        string id PK
        string type "event"
        string name
        string focusArea
        string requirement
        array services
        string registrationLink
        string dueDate
    }

    jobs_internships {
        string id PK
        string type "job"
        string name
        string focusArea
        string requirement
        array services
        string registrationLink
        string dueDate
    }

    reviews {
        string id PK
        string event_id FK
        string user_name
        number rating
        string comment
        timestamp created_at
    }

    reviews }o--|| events : "references"
    daily_picks }o--o| events : "caches"
```

---

## 7. API Endpoints Summary

```mermaid
graph LR
    subgraph Public["Public API — /api"]
        GET_health["GET /health"]
        GET_events["GET /events\n?search, date, time, category, is_free"]
        GET_event["GET /events/:id"]
        GET_biz["GET /businesses"]
        POST_rec["POST /recommendations\n{preferences}"]
        GET_pick["GET /daily-pick"]
        GET_week["GET /daily-pick/week"]
        POST_pipe["POST /pipeline/trigger\n{preferences}"]
        GET_edu["GET /education\n?type, focusArea, search"]
        POST_edu["POST /education/recommendations\n{preferences}"]
    end

    subgraph RateLimits["Rate Limits"]
        RL1["Global: 100 req / 15min / IP"]
        RL2["POST /recommendations: 20 req / 15min / IP"]
    end

    POST_rec -.->|stricter limit| RL2
    GET_events & GET_biz & GET_health -.->|global limit| RL1
```

---

## 8. Security Model

```mermaid
graph TB
    Internet["Internet / Browser"] -->|HTTPS| Vite["Vite Dev Server\n:5173"]
    Vite -->|proxy /api/*| Express["Express :3001"]

    Express --> Helmet["helmet()\nXSS, clickjacking, HSTS headers"]
    Express --> CORS["cors()\nAllowlist: ALLOWED_ORIGINS env var"]
    Express --> RateLimit["express-rate-limit\n100 req/15min global"]

    Express --> Routes["Route Handlers"]
    Routes --> Firestore["Firestore\nFirebase Admin SDK\n(service account auth)"]
    Routes --> Gemini["Gemini API\n(API key auth)"]
    Routes --> Apify["Apify\n(token auth)"]

    DotEnv[".env (never committed)\nGOOGLE_APPLICATION_CREDENTIALS\nFIREBASE_PROJECT_ID\nGEMINI_API_KEY\nAPIFY_TOKEN"] -.->|loaded at startup| Express
```
