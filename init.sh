#!/bin/bash

# FibreFlow - DR Photo AI Review Integration - Development Environment Setup
# This script sets up and runs the development environment

set -e  # Exit on any error

echo "=================================================="
echo "FibreFlow - Foto Review Module Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check if Python is available
print_status "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python version: $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if npm ci; then
    print_success "Node.js dependencies installed"
else
    print_warning "npm ci failed, trying npm install..."
    npm install
    print_success "Node.js dependencies installed"
fi

# Check if Python backend exists
PYTHON_BACKEND_PATH="/home/louisdup/VF/agents/foto/foto-evaluator-ach"
if [ -d "$PYTHON_BACKEND_PATH" ]; then
    print_status "Python backend found at: $PYTHON_BACKEND_PATH"

    # Check if Python venv exists
    if [ ! -d "$PYTHON_BACKEND_PATH/venv" ]; then
        print_status "Creating Python virtual environment..."
        cd "$PYTHON_BACKEND_PATH"
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
            print_success "Python dependencies installed"
        fi
        deactivate
        cd - > /dev/null
    else
        print_success "Python virtual environment already exists"
    fi
else
    print_warning "Python backend not found at: $PYTHON_BACKEND_PATH"
    print_warning "You'll need to set this up before evaluations will work"
fi

# Check environment variables
print_status "Checking environment variables..."
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found"
    if [ -f ".env.example" ]; then
        print_status "Creating .env.local from .env.example..."
        cp .env.example .env.local
        print_warning "Please update .env.local with your actual credentials"
    else
        print_warning "Please create .env.local with required environment variables"
    fi
else
    print_success ".env.local exists"
fi

# Build the application (required for production mode)
print_status "Building application for production mode..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Database check
print_status "Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    print_success "DATABASE_URL is set"
else
    print_warning "DATABASE_URL not set in environment"
    print_warning "Ensure it's in your .env.local file"
fi

echo ""
echo "=================================================="
echo "Setup Complete!"
echo "=================================================="
echo ""
print_success "FibreFlow development environment is ready"
echo ""
echo "Available commands:"
echo ""
echo -e "  ${GREEN}PORT=3005 npm start${NC}     - Start production server (RECOMMENDED)"
echo -e "  ${YELLOW}npm run dev${NC}             - Start dev server (has Watchpack bug - not recommended)"
echo -e "  ${BLUE}npm run build${NC}           - Build for production"
echo -e "  ${BLUE}npm run lint${NC}            - Run ESLint"
echo -e "  ${BLUE}npm run type-check${NC}      - TypeScript type checking"
echo -e "  ${BLUE}npm test${NC}                - Run tests"
echo ""
echo "Database commands:"
echo ""
echo -e "  ${BLUE}npm run db:migrate${NC}      - Run database migrations"
echo -e "  ${BLUE}npm run db:seed${NC}         - Seed database"
echo ""
echo "=================================================="
echo ""
print_status "Starting production server on port 3005..."
echo ""
echo -e "${GREEN}Access the app at: http://localhost:3005${NC}"
echo -e "${GREEN}Foto Review will be at: http://localhost:3005/foto-review${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
PORT=3005 npm start
