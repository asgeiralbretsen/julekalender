# Julekalender Monorepo

A monorepo containing a React + Vite frontend with Tailwind CSS and a .NET backend with health monitoring capabilities.

## Project Structure

```
julekalender/
├── apps/
│   ├── frontend/          # React + Vite + Tailwind CSS
│   └── backend/           # .NET Web API
├── docker-compose.yml     # Docker Compose configuration
└── package.json          # Root package.json for monorepo
```

## Features

- **Frontend**: React 18 with TypeScript, Vite for fast development, and Tailwind CSS for styling
- **Backend**: .NET 8 Web API with health endpoint
- **Health Monitoring**: Frontend displays real-time backend health status
- **Docker Support**: Full containerization with Docker Compose
- **Monorepo**: Unified development experience with workspace management

## Prerequisites

- Node.js 20+ and npm 10+
- .NET 8 SDK
- Docker and Docker Compose (optional)

## Quick Start

### Option 1: Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory
2. Run the entire stack with Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health endpoint: http://localhost:5000/health

### Option 2: Local Development

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Start both frontend and backend in development mode:
   ```bash
   npm run dev
   ```

3. Or start them individually:
   ```bash
   # Frontend only
   npm run dev:frontend
   
   # Backend only
   npm run dev:backend
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both applications
- `npm run docker:up` - Start the entire stack with Docker Compose
- `npm run docker:down` - Stop the Docker Compose stack
- `npm run docker:logs` - View Docker Compose logs

## API Endpoints

- `GET /health` - Returns backend health status with timestamp

## Development

The frontend automatically polls the backend health endpoint every 5 seconds and displays the status with a modern, responsive UI built with Tailwind CSS.

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: .NET 8, ASP.NET Core Web API
- **Containerization**: Docker, Docker Compose
- **Development**: Concurrently for running multiple processes