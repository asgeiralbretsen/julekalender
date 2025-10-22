# Cloudflare Cache Issue Fix

## Problem
API requests through Cloudflare return HTML instead of JSON, but work fine locally on the VPS.

## Root Cause
Cloudflare cached the HTML response when the API was broken, and is still serving that cached response.

## Solution

### Option 1: Purge Everything (Easiest)
1. Log into Cloudflare Dashboard
2. Go to your domain: julekalender.albretsen.no
3. Navigate to: **Caching** → **Configuration**
4. Click: **Purge Everything**
5. Wait 30 seconds
6. Test: `curl https://julekalender.albretsen.no/api/health`

### Option 2: Purge Specific URLs
1. Go to: **Caching** → **Configuration**  
2. Click: **Purge Cache** → **Custom Purge**
3. Select: **Purge by URL**
4. Add these URLs:
   - `https://julekalender.albretsen.no/api/health`
   - `https://julekalender.albretsen.no/api/users/me`
   - `https://julekalender.albretsen.no/api/*` (if supported)
5. Click: **Purge**

### Option 3: Create Page Rule to Never Cache API
1. Go to: **Rules** → **Page Rules**
2. Click: **Create Page Rule**
3. URL: `*julekalender.albretsen.no/api/*`
4. Settings:
   - **Cache Level**: Bypass
   - **Edge Cache TTL**: Bypass (if available)
5. Click: **Save and Deploy**

### Option 4: Use Development Mode (Temporary)
1. Go to: **Caching** → **Configuration**
2. Toggle: **Development Mode** → **On**
3. This disables caching for 3 hours
4. Test your API
5. Once working, turn Development Mode off and purge cache

## Verify Fix
After purging cache, test from your local machine:
```bash
curl -I https://julekalender.albretsen.no/api/health
```

Should return:
- `Content-Type: application/json; charset=utf-8`
- `Server: Kestrel` (or similar)

NOT:
- `Content-Type: text/html`
- `content-disposition: inline; filename="index.html"`

## Long-term Solution
Add this Page Rule permanently:
- URL: `*julekalender.albretsen.no/api/*`
- Cache Level: Bypass

This ensures API responses are never cached by Cloudflare.

