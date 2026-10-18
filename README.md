# StyleSense — AI-Powered Lead Generation & Email Marketing Platform

StyleSense is a full-stack lead generation and email marketing platform designed for apparel, fashion, and retail businesses. It helps identify potential business leads, extract relevant information from web search results using AI, evaluate lead quality, and organize prospects into targeted email campaigns.

The project focuses on evidence-based lead discovery, structured data validation, lead scoring, and responsible email outreach.

## Key Features

- **AI-Powered Lead Discovery:** Search for relevant businesses and potential contacts based on industry, region, company size, and target job roles.
- **Web Search Integration:** Uses LangSearch to retrieve search results and source URLs for lead research.
- **AI-Based Information Extraction:** Uses Google Gemini to extract structured lead information from search-result evidence.
- **Source Validation:** Validates extracted data with Zod and checks source URLs and supporting evidence against retrieved search results.
- **Lead Management:** Organizes company and contact information, including job titles, email addresses, source links, and discovery metadata.
- **Lead Scoring:** Calculates fit, engagement, and total scores to help prioritize prospects.
- **Campaign Management:** Supports creating, listing, retrieving, and editing draft email campaigns.
- **Campaign–Lead Assignment:** Associates leads with campaigns and checks the suppression list before assignment.
- **Mock Provider Support:** Supports controlled mock workflows for development without requiring real outreach.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- Node.js
- Express
- TypeScript
- Zod

### Database
- PostgreSQL
- Supabase

### AI and Search
- Google Gemini API
- LangSearch API

### Development and Testing
- Vitest
- Supertest
- Git and GitHub

## Architecture

The backend follows a modular structure that separates HTTP handling, business logic, validation, and database operations.

```text
stylesense-ai/
├── client/                         # React + TypeScript + Vite frontend
├── server/
│   ├── src/
│   │   ├── config/                 # Environment and database configuration
│   │   ├── repositories/           # Database access
│   │   ├── routes/                 # Express API endpoints
│   │   ├── schemas/                # Zod validation schemas
│   │   ├── services/               # Business logic and orchestration
│   │   ├── types/                  # Shared backend types
│   │   └── app.ts                  # Express application
│   └── tests/                      # Backend tests
├── supabase/
│   └── migrations/                 # Database migrations
├── .env.example
└── README.md
```

*The directory structure above describes the intended project organization; adjust individual paths to match the final repository.*

### Request Flow

1. The client submits a lead discovery or campaign request.
2. Express routes validate request data using Zod schemas.
3. Service modules execute business rules and coordinate providers.
4. Repository modules read or write data through Supabase.
5. Lead discovery combines LangSearch results with Gemini extraction.
6. Extracted leads are validated against the available source evidence before being returned.

## Lead Scoring

The scoring system combines lead fit and engagement into a total score from 0 to 100.

**Scoring formula:**

`Total Score = (Fit Score × 0.60) + (Engagement Score × 0.40)`

- **Fit score:** Measures how closely a lead matches the intended target profile.
- **Engagement score:** Represents recorded engagement signals.
- **Total score:** Helps prioritize prospects for campaign planning.

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase project
- A LangSearch API key for live web search
- A Google Gemini API key for AI extraction

### 1. Clone the repository

```bash
git clone https://github.com/riyasingh49/stylesense-ai.git
cd stylesense-ai
```

### 2. Configure environment variables

Copy the example environment file and configure the variables documented in it.

```bash
cp .env.example server/.env
```

Ensure the environment file is located where the backend configuration loads it. Configure the Supabase URL and key, LangSearch API key, Gemini API key, and other required variables according to `server/src/config/env.ts`.

Keep API keys and database credentials private. Never commit `.env` files containing secrets.

### 3. Apply database migrations

Apply the SQL migrations in `supabase/migrations/` to your Supabase project in chronological order.

### 4. Install backend dependencies

```bash
cd server
npm install
```

### 5. Start the backend

Use the development script defined in `server/package.json`:

```bash
npm run dev
```

### 6. Start the frontend

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Use the local URL printed by Vite to open the application. Configure the frontend API base URL according to the client environment settings.

> **Note:** Verify the environment-file location, available npm scripts, and frontend API configuration against the repository before following these commands.

## API Overview

The backend exposes REST endpoints for managing companies, leads, scoring, discovery, and campaigns.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/companies` | GET | List companies |
| `/api/companies` | POST | Create a company |
| `/api/companies/:id` | GET | Retrieve a company |
| `/api/leads` | GET | List leads |
| `/api/leads` | POST | Create a lead |
| `/api/leads/:id/score` | POST | Calculate and save a lead score |
| `/api/leads/:id/score-history` | GET | Retrieve lead score history |
| `/api/lead-discovery/search` | POST | Discover and extract potential leads |
| `/api/campaigns` | GET | List campaigns |
| `/api/campaigns` | POST | Create a draft campaign |
| `/api/campaigns/:id` | GET | Retrieve a campaign |
| `/api/campaigns/:id` | PATCH | Update a draft campaign |
| `/api/campaigns/:campaignId/leads` | GET | List leads assigned to a campaign |
| `/api/campaigns/:campaignId/leads` | POST | Assign leads to a campaign |

Refer to the route and schema modules for request formats, validation rules, and response structures.

## Responsible Outreach

- Lead discovery should retain source URLs and supporting evidence.
- Extracted information must not be treated as verified merely because an AI model returned it.
- Suppressed or unsubscribed email addresses must not be targeted.
- Mock workflows should be clearly identified and must not be confused with real email delivery.
- API credentials and sensitive configuration must remain outside version control.

## Development Status

The repository includes the initial database schema, company and lead management, lead scoring, and a LangSearch–Gemini lead discovery workflow. Campaign management and campaign–lead assignment are being developed.

Email delivery, tracking, unsubscribe handling, reply classification, frontend integration, and automated verification should be documented as complete only after their implementation has been reviewed.

## Future Improvements

- Complete campaign scheduling and email delivery through a sandbox provider.
- Implement unsubscribe and suppression workflows across the entire outreach lifecycle.
- Add email event tracking and reply classification.
- Complete frontend integration for lead discovery, scoring, and campaigns.
- Add automated unit and integration tests.
- Improve deployment documentation and operational monitoring.

## Author

**Riya Singh**

- GitHub: [riyasingh49](https://github.com/riyasingh49)
- Portfolio: [Visit Portfolio](https://portfolio-nine-gamma-dcv64029u5.vercel.app)

---

Built as a full-stack engineering project exploring AI-assisted lead discovery, data validation, scoring, and campaign management.