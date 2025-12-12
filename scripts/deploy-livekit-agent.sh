#!/bin/bash
# LiveKit Python Agent Deployment Script
# Run this on your VPS to deploy the AI meeting agent

set -e

echo "==================================="
echo "LiveKit Agent Deployment"
echo "==================================="

# Configuration
AGENT_DIR="/opt/livekit-agent"

# Step 1: Check Python version
echo "🐍 Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi
python3 --version

# Step 2: Create agent directory
echo "📁 Creating agent directory..."
sudo mkdir -p $AGENT_DIR
sudo chown -R $USER:$USER $AGENT_DIR

# Step 3: Copy agent files (assumes files are in current directory)
echo "📋 Copying agent files..."
if [ -d "agents" ]; then
    cp -r agents/* $AGENT_DIR/
else
    echo "⚠️  No agents directory found. Please copy agent files manually to $AGENT_DIR"
fi

# Step 4: Create virtual environment
echo "🔧 Setting up virtual environment..."
cd $AGENT_DIR
python3 -m venv venv
source venv/bin/activate

# Step 5: Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install "livekit-agents[openai,silero,deepgram,turn-detector]~=1.0" psycopg2-binary python-dotenv

# Step 6: Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env template..."
    cat > .env << 'EOF'
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
OPENAI_API_KEY=your-openai-key
DATABASE_URL=your-neon-database-url
EOF
    echo "⚠️  Please edit $AGENT_DIR/.env with your credentials"
fi

# Step 7: Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/livekit-agent.service > /dev/null << EOF
[Unit]
Description=LiveKit Meeting Agent
After=network.target docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$AGENT_DIR
Environment=PATH=$AGENT_DIR/venv/bin
ExecStart=$AGENT_DIR/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 8: Enable and start service
echo "🚀 Starting agent service..."
sudo systemctl daemon-reload
sudo systemctl enable livekit-agent
sudo systemctl start livekit-agent

# Step 9: Check status
echo ""
echo "📊 Agent status:"
sudo systemctl status livekit-agent --no-pager || true

echo ""
echo "==================================="
echo "🎉 Agent Deployment Complete!"
echo "==================================="
echo ""
echo "Commands:"
echo "  View logs: sudo journalctl -u livekit-agent -f"
echo "  Restart:   sudo systemctl restart livekit-agent"
echo "  Stop:      sudo systemctl stop livekit-agent"
echo ""
