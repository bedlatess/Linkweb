#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# LinkWeb Deployment Script
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_DIR="/opt/linkweb"
SERVICE_NAME="linkweb.service"
PORT=3010

echo "═══════════════════════════════════════════════════════════════"
echo "  LinkWeb Deployment"
echo "═══════════════════════════════════════════════════════════════"

cd "$PROJECT_DIR"

# Step 1: Install dependencies
echo "→ Installing dependencies..."
npm install --production=false

# Step 2: Generate Prisma Client
echo "→ Generating Prisma client..."
npx prisma generate

# Step 3: Run database migrations
echo "→ Running database migrations..."
npx prisma migrate deploy

# Step 4: Seed admin user
echo "→ Seeding admin user..."
npx prisma db seed || echo "⚠ Seed failed or already exists"

# Step 5: Build Next.js
echo "→ Building Next.js..."
npm run build

# Step 6: Create systemd service
echo "→ Creating systemd service..."
cat > "/etc/systemd/system/$SERVICE_NAME" <<'EOF'
[Unit]
Description=LinkWeb - Personal Link Aggregation Platform
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/linkweb
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
EnvironmentFile=/opt/linkweb/.env
StandardOutput=append:/var/log/linkweb.log
StandardError=append:/var/log/linkweb.log

[Install]
WantedBy=multi-user.target
EOF

# Step 7: Reload systemd and start service
echo "→ Starting service..."
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

sleep 3

# Step 8: Check status
echo ""
echo "═══════════════════════════════════════════════════════════════"
systemctl --no-pager status "$SERVICE_NAME" | head -20
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Deployment complete!"
echo ""
echo "   Service: $SERVICE_NAME"
echo "   Port: $PORT"
echo "   Logs: /var/log/linkweb.log"
echo ""
echo "   Test: curl -I http://localhost:$PORT"
echo ""
