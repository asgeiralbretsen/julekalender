# Backend API

This is the .NET backend API for the Julekalender application.

## Features

- PostgreSQL database integration
- Entity Framework Core with migrations
- Clerk authentication integration
- User management with webhook support
- CORS configuration for frontend

## Database Setup

The application uses PostgreSQL as the database. The database is configured to run in a Docker container.

### Running the Database

1. Start the PostgreSQL container:
   ```bash
   docker-compose up postgres -d
   ```

2. Run database migrations:
   ```bash
   dotnet ef database update
   ```

   Or use the setup script:
   ```bash
   ./scripts/database-setup.sh
   ```

### Database Schema

The application includes a `User` table with the following fields:
- `Id` (Primary Key)
- `ClerkId` (Unique, from Clerk authentication)
- `Email` (Unique)
- `FirstName`
- `LastName`
- `ImageUrl`
- `CreatedAt`
- `UpdatedAt`

## Clerk Integration

The backend integrates with Clerk for authentication:

1. **Webhook Endpoint**: `/api/users/webhook`
   - Handles user creation, updates, and deletion events from Clerk
   - Automatically creates/updates users in the database

2. **User Endpoint**: `/api/users/{clerkId}`
   - Retrieves user information by Clerk ID

## Environment Variables

- `ConnectionStrings__DefaultConnection`: PostgreSQL connection string
- `ASPNETCORE_ENVIRONMENT`: Environment (Development/Production)

## Development

1. Install dependencies:
   ```bash
   dotnet restore
   ```

2. Start the database:
   ```bash
   docker-compose up postgres -d
   ```

3. Run migrations:
   ```bash
   dotnet ef database update
   ```

4. Start the application:
   ```bash
   dotnet run
   ```

## Docker

The application can be run in Docker using the provided Dockerfile and docker-compose.yml configuration.
