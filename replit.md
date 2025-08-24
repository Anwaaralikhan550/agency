# Overview

CloudBiz Pro is a complete cloud-based business management system designed as a Progressive Web App (PWA). The application provides dual-panel functionality with an Admin Panel for system control and a User Panel for business customers. It offers comprehensive features for inventory management, customer relationship management, sales tracking, and business analytics with automated subscription management and notification systems.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and developer experience
- **UI Framework**: TailwindCSS with shadcn/ui component library for consistent, modern design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling
- **PWA Support**: Complete PWA implementation with manifest, service worker, and offline capabilities

## Backend Architecture
- **Server Framework**: Express.js with TypeScript for API endpoints
- **Authentication**: Dual authentication system supporting both Replit Auth (OAuth) and traditional email/password
- **API Design**: RESTful API structure with role-based access control (admin/user)
- **Session Management**: Express sessions with PostgreSQL session store for persistent authentication
- **Password Security**: BCrypt for password hashing and secure authentication

## Database Design
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Structure**: 
  - Users table with role-based permissions (admin/user)
  - Business entities: customers, inventory, sales, notifications
  - Session storage for authentication persistence
- **Data Relationships**: Proper foreign key relationships between users and their business data
- **Validation**: Zod schemas for runtime validation across frontend and backend

## Security & Access Control
- **Role-Based Authentication**: Separate admin and user access levels with different capabilities
- **Route Protection**: Authentication middleware protecting all API endpoints
- **Session Security**: Secure session configuration with HTTP-only cookies
- **Input Validation**: Comprehensive validation using Zod schemas on both client and server

## User Experience Features
- **Responsive Design**: Mobile-first design with desktop optimization
- **Dark/Light Theme**: Complete theme system with user preference persistence
- **Real-time Updates**: Automatic data refresh and live notifications
- **Progressive Enhancement**: Works offline with service worker caching
- **Accessibility**: ARIA labels and keyboard navigation support

# External Dependencies

## Database & Hosting
- **Neon PostgreSQL**: Serverless PostgreSQL database for data persistence
- **Vercel**: Deployment platform optimized for Next.js applications

## Authentication Services
- **Replit Auth**: OAuth-based authentication for seamless Replit integration
- **Custom Auth**: Email/password authentication system with session management

## UI & Styling
- **Radix UI**: Accessible, unstyled component primitives
- **TailwindCSS**: Utility-first CSS framework for styling
- **Lucide React**: Modern icon library for consistent iconography
- **Google Fonts**: Inter font family for typography

## Development & Build Tools
- **Vite**: Fast build tool and development server
- **ESBuild**: JavaScript bundler for production builds
- **TypeScript**: Static type checking for improved code quality
- **Drizzle Kit**: Database migration and schema management tools

## Business Logic Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **React Hook Form**: Form state management and validation
- **TanStack Query**: Server state management and caching