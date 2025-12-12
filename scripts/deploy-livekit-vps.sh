#!/bin/bash
# LiveKit VPS Deployment Script
# Run this on your VPS to deploy LiveKit server and Egress

set -e

echo "==================================="
echo "LiveKit VPS Deployment"
echo "==================================="

# Configuration - UPDATE THESE VALUES
LIVEKIT_API_KEY="APIKey$(openssl rand -hex 8)"
LIVEKIT_API_SECRET="$(openssl rand -hex 32)"
VPS_IP=$(curl -s ifconfig.me || echo "YOUR_VPS_IP")

echo ""
echo "Generated credentials:"
echo "  API Key: $LIVEKIT_API_KEY"
echo "  API Secret: $LIVEKIT_API_SECRET"
echo "  VPS IP: $VPS_IP"
echo ""

# Step 1: Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Step 2: Create directories
echo "📁 Creating directories..."
sudo mkdir -p /opt/livekit
sudo mkdir -p /opt/recordings
sudo chown -R $USER:$USER /opt/livekit /opt/recordings

# Step 3: Create LiveKit config
echo "📝 Creating LiveKit configuration..."
cat > /opt/livekit/config.yaml << EOF
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  $LIVEKIT_API_KEY: $LIVEKIT_API_SECRET
logging:
  level: info
webhook:
  urls:
    - https://app.fibreflow.app/api/livekit/webhooks
EOF
echo "✅ Configuration created at /opt/livekit/config.yaml"

# Step 4: Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker stop livekit 2>/dev/null || true
docker rm livekit 2>/dev/null || true
docker stop livekit-egress 2>/dev/null || true
docker rm livekit-egress 2>/dev/null || true

# Step 5: Run LiveKit server
echo "🚀 Starting LiveKit server..."
docker run -d \
  --name livekit \
  --restart unless-stopped \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 50000-60000:50000-60000/udp \
  -v /opt/livekit:/opt/livekit \
  livekit/livekit-server \
  --config /opt/livekit/config.yaml

echo "✅ LiveKit server started"

# Step 6: Run Egress service
echo "🎥 Starting Egress service..."
docker run -d \
  --name livekit-egress \
  --restart unless-stopped \
  -e EGRESS_CONFIG_STRING="$(cat << EGRESS_EOF
log_level: info
api_key: $LIVEKIT_API_KEY
api_secret: $LIVEKIT_API_SECRET
ws_url: ws://localhost:7880
insecure: true
EGRESS_EOF
)" \
  -v /opt/recordings:/home/egress/recordings \
  --network host \
  livekit/egress

echo "✅ Egress service started"

# Step 7: Verify containers are running
echo ""
echo "📊 Container status:"
docker ps --filter "name=livekit"

# Step 8: Print environment variables for Next.js
echo ""
echo "==================================="
echo "🎉 Deployment Complete!"
echo "==================================="
echo ""
echo "Add these to your .env.local:"
echo ""
echo "LIVEKIT_URL=ws://$VPS_IP:7880"
echo "LIVEKIT_API_KEY=$LIVEKIT_API_KEY"
echo "LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET"
echo ""
echo "For the Python agent, create agents/.env with:"
echo ""
echo "LIVEKIT_URL=ws://$VPS_IP:7880"
echo "LIVEKIT_API_KEY=$LIVEKIT_API_KEY"
echo "LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET"
echo "OPENAI_API_KEY=your-openai-key"
echo "DATABASE_URL=your-neon-database-url"
echo ""
echo "==================================="
