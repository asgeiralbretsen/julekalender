# Fix for Julekalender Networking

## The Problem
Your tunnel is pointing `julekalender.albretsen.no` directly to `localhost:3001` (frontend), which prevents Caddy from:
1. Getting SSL certificates (ACME challenge fails)
2. Routing API requests to the backend

## The Solution
Change your tunnel configuration to point to Caddy instead of the frontend directly.

### Current Setup (Broken)
```
julekalender.albretsen.no → localhost:3001 (frontend only)
```

### Fixed Setup
```
julekalender.albretsen.no → localhost:80 (Caddy)
```

## Steps to Fix

1. **Update your tunnel configuration** to point to `localhost:80` instead of `localhost:3001`

2. **Restart Caddy** to get fresh SSL certificates:
   ```bash
   docker-compose restart caddy
   ```

3. **Test the setup**:
   ```bash
   ./test-networking.sh
   ```

## How It Will Work After Fix

1. **Tunnel**: `julekalender.albretsen.no` → `localhost:80` (Caddy)
2. **Caddy**: Gets SSL certificates and routes:
   - `/api/*` → Backend container
   - `/*` → Frontend container
3. **Frontend**: Serves from `https://julekalender.albretsen.no`
4. **API**: Available at `https://julekalender.albretsen.no/api/health`

## Why This Fixes It

- Caddy can complete ACME challenges to get SSL certificates
- All requests go through Caddy's routing rules
- API requests are properly routed to the backend
- Frontend requests are properly routed to the frontend
