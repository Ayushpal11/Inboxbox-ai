#!/bin/bash

echo "🚀 Setting up Onebox Email Aggregator..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
npm install mailparser
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your email credentials"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data
echo "✅ Data directory created"
echo ""

# Check if Docker is running
echo "🐳 Checking Docker..."
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker is not running. Please start Docker first."
    echo "   After starting Docker, run: docker-compose up -d"
else
    echo "✅ Docker is running"
    echo ""
    
    # Start Elasticsearch
    echo "🔍 Starting Elasticsearch..."
    docker-compose up -d
    if [ $? -eq 0 ]; then
        echo "✅ Elasticsearch started"
        echo "⏳ Waiting for Elasticsearch to be ready (30 seconds)..."
        sleep 30
        
        # Check Elasticsearch health
        if curl -s http://localhost:9200 > /dev/null; then
            echo "✅ Elasticsearch is ready"
        else
            echo "⚠️  Elasticsearch might still be starting. Please wait a moment."
        fi
    else
        echo "❌ Failed to start Elasticsearch"
        exit 1
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your email credentials"
echo "   2. Run: npm run dev"
echo "   3. Open public/index.html in your browser"
echo ""
echo "📚 For detailed instructions, see QUICKSTART.md"
echo ""