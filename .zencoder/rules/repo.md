# CogniFlow ERP - Repository Information

## Project Overview

CogniFlow ERP is a comprehensive Enterprise Resource Planning system with multiple modules including CRM, Sales, Inventory, and more. The application is built using modern web technologies and provides real-time functionality through WebSocket connections.

## Technology Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for component primitives
- **Wouter** for routing
- **React Query** for state management and data fetching

### Backend
- **Node.js** with Express
- **TypeScript**
- **Drizzle ORM** for database management
- **PostgreSQL** database
- **WebSocket** for real-time updates

## Project Structure

```
├── client/          # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility libraries
├── server/          # Backend Node.js application
│   ├── src/         # Server source code
│   ├── routes.ts    # API routes
│   └── websocket.ts # WebSocket handlers
├── shared/          # Shared types and schemas
└── migrations/      # Database migrations
```

## Key Features

- **CRM Module**: Contact management, activities, deals tracking
- **Sales Module**: Order management, invoicing
- **Inventory Module**: Product management, stock tracking
- **Real-time Updates**: WebSocket connections for live data
- **Multi-tenant**: Company-based data separation

## Common Issues and Solutions

### Dialog Component Issues
- Ensure DialogContent is always wrapped within Dialog components
- Common error: "DialogPortal must be used within Dialog"

### WebSocket Connections
- The app uses real-time WebSocket connections for live updates
- Connection management is handled automatically with reconnection logic

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run migration:generate` - Generate database migrations
- `npm run migration:run` - Run pending migrations

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables include:
- users, companies (authentication and multi-tenancy)
- contacts, leads, deals (CRM functionality)  
- products, inventory (inventory management)
- invoices, orders (sales functionality)
- activities (activity tracking)