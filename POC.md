## Event Companion POC

### 1. Overview
- **Purpose**: Demonstrate an AI-assisted event companion experience that guides attendees from onboarding to networking and content discovery.
- **Problem**: Event participants struggle to identify relevant sessions, make meaningful connections, and stay informed in real time.
- **Solution**: Deliver a responsive Next.js application with AI-powered agenda planning, smart networking, and conversational assistance.

### 2. User Journeys
- **Landing Page**: Communicates value proposition, highlights feature set, and routes visitors to onboarding.
- **Onboarding Flow**: Simulates LinkedIn PDF upload, extracts interests, and builds a personalized profile.
- **Dashboard Experience**: Shows quick stats, provides entry points to agenda, networking, and AI concierge.
- **Agenda Management**: Presents daily schedule with priority sessions and CTA to explore more.
- **Networking Hub**: Surfaces recommended people/matches based on shared interests and session attendance.
- **Chat Concierge**: Embeds an AI assistant to answer questions and offer recommendations.

### 3. Architecture & Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript for type safety and server-first rendering.
- **UI Toolkit**: Shadcn/UI primitives enhanced with Tailwind CSS 4 and custom theming.
- **State & Forms**: React hooks paired with React Hook Form and Zod for validation (future integration point).
- **Styling**: Tailwind utility classes, global CSS tokens, and Geist font via `geist/font` package.
- **Charts & Visuals**: Recharts and Embla Carousel available for analytics and interactive content.
- **Build Tooling**: pnpm workspace, PostCSS pipeline, and transpiled Geist package for compatibility.

### 4. Feature Highlights
- Personalized onboarding with step-based progression and mocked AI interest extraction.
- Dynamic dashboard cards showcasing key metrics (sessions, matches, messages, match rate).
- Modular navigation and layout system to support agenda, networking, chat, and future apps.
- Responsive design with mobile-first components and accessible form elements.

### 5. Current Limitations / Future Enhancements
- **Data Layer**: Static mock data; integrate real APIs (LinkedIn, schedule, attendee graph).
- **AI Services**: Replace placeholders with LLM-based recommendation and concierge pipelines.
- **Authentication**: Add secure auth (NextAuth/Auth0) and role-based access.
- **Analytics**: Instrument user flows, capture engagement metrics, and feed personalization engine.
- **Offline & Notifications**: Introduce push updates, calendar sync, and offline-ready agenda view.

### 6. Setup & Runbook
- Install dependencies with `pnpm install` (approved builds for Geist).
- Start dev server via `pnpm dev` (listens on port 3000).
- Optional: adjust `config.theme` tokens in `app/globals.css` and `components/ui` as needed.
- Configure Gemini access by adding the following environment variables:
  - `GOOGLE_GEMINI_API_KEY`: Google AI Studio API key with access to the selected model.
  - (Optional) `GOOGLE_GEMINI_MODEL`: Overrides the default `gemini-1.5-flash` model name.
  Add these to `.env.local` and restart the dev server after changes.

### 7. Next Steps
- Define data contracts for agenda, attendee profiles, and chat history.
- Prototype AI matching service and hook it into networking view.
- Validate usability with target user interviews and iterate on UX gaps.
- Prepare deployment pipeline (Vercel/Azure) and environment management.
