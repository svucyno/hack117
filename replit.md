# Overview

This is a full-stack agricultural technology application called "AgriPredict" built for Smart India Hackathon 2025. The application provides AI-powered crop yield prediction and optimization recommendations to help farmers make data-driven decisions. It features a React.js frontend with TailwindCSS styling, Express.js backend, and supports multilingual functionality (English, Hindi, Odia) to serve diverse farming communities across India.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React.js with TypeScript and Vite build system
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with custom agricultural theme (green/blue color scheme)
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Internationalization**: React-i18next with support for English, Hindi, and Odia languages
- **Charts**: Recharts for yield prediction visualizations
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL session store
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for request/response validation
- **File Structure**: Monorepo with shared schema definitions between client and server

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM with schema migrations
- **Session Storage**: PostgreSQL-based session storage for authentication
- **Schema Design**: Relational design with tables for users, crops, predictions, recommendations, chats, and weather data

## Authentication and Authorization
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Management**: Server-side sessions with secure cookies
- **User Roles**: Role-based access control with farmer, officer, and admin roles
- **Protection**: Route-level authentication middleware for API endpoints

## Key Features and Components
- **Yield Prediction Charts**: Interactive visualizations using Recharts
- **Weather Integration**: Mock weather API with district-based forecasts
- **AI Chatbot**: Multi-language chatbot with preloaded Q&A data (no external AI API)
- **Recommendation Engine**: Personalized irrigation, fertilizer, and crop management suggestions
- **Admin Dashboard**: User management and aggregated prediction analytics
- **Mobile Responsive**: Fully responsive design optimized for mobile devices

## Development and Build System
- **Build Tool**: Vite for fast development and optimized production builds
- **TypeScript**: Full TypeScript support with strict type checking
- **Hot Reload**: Vite HMR for rapid development feedback
- **Path Aliases**: Configured aliases for clean import statements
- **ESM**: Full ES Modules support throughout the application

# External Dependencies

## Database and Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle Kit**: Database migration and schema management tools
- **Connect-PG-Simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **TailwindCSS**: Utility-first CSS framework with custom agricultural theme
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Chart library for data visualizations

## Development and Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type checking and development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Authentication and Session Management
- **Replit Auth**: OAuth provider integration
- **OpenID Client**: OpenID Connect authentication flow
- **Passport.js**: Authentication middleware strategy
- **Express Session**: Server-side session management

## Form Handling and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation for forms and API endpoints
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Internationalization
- **React-i18next**: Internationalization framework with language switching
- **JSON Language Files**: Structured translation files for English, Hindi, and Odia

## Utilities and Helpers
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Utility for creating component variants
- **CLSX**: Conditional CSS class name utility
- **Memoizee**: Function memoization for performance optimization