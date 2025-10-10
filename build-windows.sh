#!/bin/bash

# Hardware Store POS - Windows Build Script
echo "🏪 Building Hardware Store POS for Windows..."

# Create build directory
mkdir -p build/windows

# Build frontend
echo "📱 Building frontend..."
cd frontend
npm run build
cd ..

# Copy frontend build to backend static directory
echo "📁 Copying frontend assets..."
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

# Build backend for Windows
echo "🔧 Building backend for Windows..."
cd backend
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../build/windows/hardware-store-pos.exe cmd/server/main.go
cd ..

# Copy database directory structure
echo "🗄️ Setting up database directory..."
mkdir -p build/windows/database

# Copy environment template
echo "⚙️ Copying configuration template..."
cp backend/.env.example build/windows/.env

# Create startup script for Windows
echo "📝 Creating Windows startup script..."
cat > build/windows/start.bat << 'EOF'
@echo off
echo Starting Hardware Store POS...
echo.
echo Frontend will be available at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
hardware-store-pos.exe
pause
EOF

# Create README for Windows deployment
cat > build/windows/README.txt << 'EOF'
Hardware Store POS - Windows Deployment

INSTALLATION:
1. Extract all files to a folder (e.g., C:\HardwarePOS)
2. Edit .env file with your settings (optional)
3. Double-click start.bat to run

FIRST RUN:
- The database will be created automatically
- Open browser and go to: http://localhost:8080
- Default login will be created (see documentation)

CONFIGURATION:
- Edit .env file to change port, database path, etc.
- Database will be stored in the 'database' folder

STOPPING:
- Press Ctrl+C in the console window
- Or close the console window

TROUBLESHOOTING:
- Make sure port 8080 is not used by other applications
- Check that Windows Defender is not blocking the executable
- Run as Administrator if you encounter permission issues

VERSION: 1.0.0
BUILT: $(date)
EOF

echo "✅ Windows build complete!"
echo "📦 Files created in build/windows/"
echo ""
echo "To deploy:"
echo "1. Copy build/windows/ folder to Windows machine"
echo "2. Edit .env file if needed"
echo "3. Run start.bat"
echo ""
echo "Build info:"
echo "- Frontend: Static files included"
echo "- Backend: Pure Go (no CGO dependencies)"
echo "- Database: SQLite (portable)"
echo "- Size: $(du -sh build/windows | cut -f1)"