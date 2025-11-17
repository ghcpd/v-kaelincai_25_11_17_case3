# setup.ps1 for Project B Improved Live Panel
# Installs dependencies and prepares the development environment (Windows)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================="
Write-Host "Setting up Project B - Improved Live Panel"
Write-Host "=========================================="
Write-Host "Project Directory: $ProjectDir"
Write-Host ""

# Check for Node.js
try {
    $NodeVersion = node --version
    Write-Host "✓ Node.js version: $NodeVersion"
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}

try {
    $NpmVersion = npm --version
    Write-Host "✓ npm version: $NpmVersion"
} catch {
    Write-Host "❌ npm is not installed or not in PATH"
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "[1/3] Installing dependencies..."
Push-Location $ProjectDir
npm install
Pop-Location

# Build project
Write-Host "[2/3] Building project..."
Push-Location $ProjectDir
npm run build
Pop-Location

# Generate types
Write-Host "[3/3] Generating TypeScript types..."
Push-Location $ProjectDir
npm run build
Pop-Location

Write-Host ""
Write-Host "=========================================="
Write-Host "✓ Setup complete!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Start dev server: npm run dev"
Write-Host "  2. Open http://localhost:3000 in browser"
Write-Host "  3. Run tests: npm test"
Write-Host ""
Write-Host "For automated testing: .\run_tests.ps1"
Write-Host ""
Write-Host "Features in this improved version:"
Write-Host "  ✓ Tabbed interface (Program Interaction, Live Wall, Queue)"
Write-Host "  ✓ Responsive design (mobile-first with Tailwind CSS)"
Write-Host "  ✓ Accessibility features (keyboard navigation, ARIA labels)"
Write-Host "  ✓ Weak-network handling (loading states, retry buttons)"
Write-Host "  ✓ Visual feedback (status badges, toasts, error messages)"
Write-Host "=========================================="
