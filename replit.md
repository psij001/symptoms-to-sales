# Symptoms to Sales 2.0

## Overview

Symptoms to Sales 2.0 is a consolidated SaaS platform that provides professional AI-powered writing tools for marketers and deal-makers. The application replaces a previous 7-tool Pickaxe-based suite with a unified Next.js application powered by Claude AI (Anthropic).

The platform centers around Travis Sago's "Symptomatic Writing" methodology, which emphasizes sensory-based, conversational copy that focuses on observable symptoms rather than abstract problems. Core tools include Triangle of Insight (Symptom → Wisdom → Metaphor generator), T1 Email Creator (7 email types), Symptomatic Subject Lines, and CAP Creator.

The application supports project-based workflows where users can switch between personal, partner, and client work contexts, with each project having its own Voice DNA and Offer Context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 16 with App Router and React Server Components
- **Styling**: Tailwind CSS 4 with shadcn/ui component library (New York style)
- **State Management**: Zustand for client-side state (generation state, project context)
- **Data Fetching**: TanStack React Query for server state management
- **Fonts**: Inter (sans-serif) and Spectral (serif) via next/font

### Route Structure
- `(auth)` group: Login/register pages with centered card layout
- `(dashboard)` group: Protected routes with sidebar navigation
- Tools live under `/dashboard/tools/*` (triangle, t1-email, subject-lines)

### Backend Architecture
- **API Routes**: Next.js Route Handlers for all API endpoints
- **Authentication**: Replit OpenID Connect with iron-session for session management
- **AI Integration**: Claude API (Anthropic) with streaming responses
  - Sonnet model for high-quality writing (emails, Triangle outputs)
  - Haiku model for faster pattern-based tasks (subject lines)

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Users, Projects, Voice DNA, Offer Contexts, Generations
- **Storage Pattern**: DatabaseStorage class implementing IStorage interface

### AI Prompt Architecture
- **Layered Context System**: Each generation request combines:
  1. Travis IP Foundation (core methodology - always present)
  2. Tool-specific prompts (from `/lib/prompts/*`)
  3. Voice DNA (extracted writing style from user uploads)
  4. Offer Context (project-specific data)
  5. Forbidden patterns (style rules to avoid)

### Design System
- Dark mode first ("The Writer's Studio" theme)
- Custom CSS variables for colors, spacing, typography
- Project type color coding: Personal (amber), Partner (green), Client (blue)

## External Dependencies

### AI Services
- **Anthropic Claude API**: Primary AI for all content generation
  - Models: claude-sonnet-4-20250514 (writing), claude-3-5-haiku-20241022 (fast tasks)
  - Requires `ANTHROPIC_API_KEY` environment variable

### Authentication
- **Replit OpenID Connect**: OAuth2/OIDC authentication flow
  - Requires `REPL_ID` and `ISSUER_URL` environment variables
  - Session management via `iron-session` with `SESSION_SECRET`

### Database
- **PostgreSQL**: Primary data store
  - Requires `DATABASE_URL` environment variable
  - Session storage via `connect-pg-simple`

### Key NPM Packages
- `openid-client`: OIDC client for Replit auth
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@anthropic-ai/sdk`: Official Claude API client
- `zod`: Schema validation
- `react-hook-form` with `@hookform/resolvers`: Form handling