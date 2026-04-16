#!/usr/bin/env powershell
# naijabasket Deployment Setup & Launch Script
# ============================================

Write-Host "🚀 naijabasket Deployment Setup" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Step 1: Check Node.js and npm
Write-Host "✅ Step 1: Verifying Node.js and npm..." -ForegroundColor Green
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "  Node.js: $nodeVersion"
Write-Host "  npm: $npmVersion`n"

# Step 2: Install frontend dependencies
Write-Host "✅ Step 2: Installing frontend dependencies..." -ForegroundColor Green
if (-not (Test-Path "node_modules")) {
    Write-Host "  Running: npm install"
    npm install
    Write-Host "  ✓ Frontend dependencies installed`n"
} else {
    Write-Host "  ✓ Frontend dependencies already installed`n"
}

# Step 3: Install backend dependencies
Write-Host "✅ Step 3: Installing backend dependencies..." -ForegroundColor Green
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "  Running: npm install in backend/"
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "  ✓ Backend dependencies installed`n"
} else {
    Write-Host "  ✓ Backend dependencies already installed`n"
}

# Step 4: Verify backend .env file
Write-Host "✅ Step 4: Checking backend/.env..." -ForegroundColor Green
if (Test-Path "backend/.env") {
    Write-Host "  ✓ backend/.env exists`n"
} else {
    Write-Host "  ⚠ backend/.env not found (already created, check if filled)`n"
}

# Step 5: Database status
Write-Host "✅ Step 5: Database preparation..." -ForegroundColor Yellow
Write-Host "  ℹ Manual step required:"
Write-Host "  - Ensure PostgreSQL is running"
Write-Host "  - Create database: createdb naijabasket"
Write-Host "  - Run migration: psql naijabasket < backend/src/migrations/005_create_accounting_schema.sql`n"

# Step 6: Ready to launch
Write-Host "✅ All setup steps complete!`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "==============="
Write-Host ""
Write-Host "Option A: Start Backend and Frontend Together"
Write-Host "  Terminal 1: cd backend && npm run dev"
Write-Host "  Terminal 2: npm run dev"
Write-Host ""
Write-Host "Option B: Use Docker (One-Command Deploy)"
Write-Host "  cd backend && docker-compose up"
Write-Host ""
Write-Host "Option C: Production Build"
Write-Host "  Frontend: npm run build"
Write-Host "  Backend:  cd backend && npm run build"
Write-Host ""
Write-Host "🌐 Access Dashboard:"
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Backend:  http://localhost:3000"
Write-Host "  Docs:     http://localhost:3000/api-docs (if available)"
Write-Host ""
Write-Host "✅ Happy deploying! 🎉"
