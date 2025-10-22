#!/bin/bash

# This script fixes a potential Caddy handler order issue
# In Caddy, the order of handle blocks matters

echo "🔧 Fixing Caddy handler order..."
echo ""

# Create a new Caddyfile with explicit order
cat > Caddyfile.new << 'EOF'
{
    # Global options
    admin localhost:2019
}

julekalender.albretsen.no, http://julekalender.albretsen.no {
    # Route API requests FIRST (highest priority)
    @api {
        path /api/*
    }
    
    handle @api {
        reverse_proxy julekalender-backend:5000 {
            header_up Host {host}
            header_up X-Real-IP {remote}
        }
        
        # Add cache control headers
        header Cache-Control "no-cache, no-store, must-revalidate"
        header Pragma "no-cache"
        header Expires "0"
    }
    
    # Route studio requests
    @studio {
        path /studio/*
    }
    
    handle @studio {
        reverse_proxy julekalender-studio:3333 {
            header_up Host {host}
            header_up X-Real-IP {remote}
        }
    }
    
    # Route everything else to frontend (SPA fallback)
    handle {
        reverse_proxy julekalender-frontend:80 {
            header_up Host {host}
            header_up X-Real-IP {remote}
        }
    }
    
    # Enable compression
    encode gzip
    
    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
EOF

echo "Created new Caddyfile with explicit matchers"
echo ""
echo "Backup old Caddyfile:"
cp Caddyfile Caddyfile.backup
echo ""

echo "Replace with new version? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    mv Caddyfile.new Caddyfile
    echo "✅ Caddyfile updated"
    echo ""
    echo "Restart Caddy:"
    docker restart julekalender-caddy
    sleep 3
    echo ""
    echo "Test:"
    curl -s http://localhost/api/health
else
    echo "Cancelled. New version saved as Caddyfile.new"
    echo "Review it with: cat Caddyfile.new"
fi

