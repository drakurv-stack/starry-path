# Orbit — Recovery Companion

## Overview

Orbit is a recovery companion web application designed to help users track their progress in overcoming addictive behaviors. The app features a gentle onboarding flow, daily check-ins, streak tracking with gamification (orbs), a community support section, educational lessons, and a coach messaging feature. The application uses a dark, space-themed UI with glassmorphism design elements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, localStorage for client-side persistence
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: REST API with `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod for type-safe validation
- **Session Management**: Express session with connect-pg-simple for PostgreSQL session storage

### Data Storage
- **Primary Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` contains all Drizzle table definitions
- **Client-side Persistence**: localStorage used extensively for onboarding state, profile data, streaks, and user preferences
- **Storage Abstraction**: `server/storage.ts` provides an IStorage interface with MemStorage implementation for development

### Key Data Models
- **Users**: Basic authentication with username/password
- **Checkins**: Daily mood, urge levels, triggers, wins, and relapse tracking
- **Streaks**: Current/longest streak, orbs (gamification points), free-since date
- **Community Posts**: Anonymous posts with tags, likes, and threaded replies
- **Learn Lessons**: Educational content with completion tracking
- **Coach Messages**: AI coach conversation history

### Design Patterns
- **Shared Types**: Types defined in `shared/` directory are shared between client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared modules
- **Mock Authentication**: Currently uses a mock user ID (1) for MVP development
- **Glass UI Pattern**: Components use `glass` and `glow` CSS classes for the space-themed aesthetic

## External Dependencies

### Database & Storage
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **Drizzle Kit**: Database migrations stored in `/migrations` directory

### UI Framework Dependencies
- **Radix UI**: Full suite of accessible, unstyled primitives
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **Vaul**: Drawer component
- **cmdk**: Command palette component

### Development & Build
- **Vite**: Development server and production builds
- **esbuild**: Server-side bundling for production
- **TSX**: TypeScript execution for development

### Replit-specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator