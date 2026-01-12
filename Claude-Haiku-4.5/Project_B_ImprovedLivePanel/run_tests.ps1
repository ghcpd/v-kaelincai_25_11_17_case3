# run_tests.ps1 for Project B Improved Live Panel
# Windows PowerShell version

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $ProjectDir "logs"
$ResultsDir = Join-Path $ProjectDir "results"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
if (-not (Test-Path $ResultsDir)) { New-Item -ItemType Directory -Path $ResultsDir | Out-Null }

Write-Host "==========================================  "
Write-Host "Improved Live Interaction Panel - Test Run"
Write-Host "=========================================="
Write-Host "Project Directory: $ProjectDir"
Write-Host "Timestamp: $Timestamp"
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/5] Installing dependencies..."
if (-not (Test-Path (Join-Path $ProjectDir "node_modules"))) {
    Push-Location $ProjectDir
    npm install 2>&1 | Tee-Object -FilePath (Join-Path $LogDir "install_${Timestamp}.log")
    Pop-Location
} else {
    Write-Host "  node_modules already exists, skipping npm install"
}

# Step 2: Build the project
Write-Host "[2/5] Building project..."
Push-Location $ProjectDir
npm run build 2>&1 | Tee-Object -FilePath (Join-Path $LogDir "build_${Timestamp}.log")
Pop-Location

# Step 3: Start dev server in background
Write-Host "[3/5] Starting development server on port 3000..."
Push-Location $ProjectDir
$ServerLog = Join-Path $LogDir "server_${Timestamp}.log"
$DevServerProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -RedirectStandardOutput $ServerLog -PassThru -NoNewWindow
Write-Host "  Dev server started with PID: $($DevServerProcess.Id)"
Pop-Location

# Wait for server to be ready
Start-Sleep -Seconds 5
$Ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            Write-Host "  ✓ Server is ready"
            $Ready = $true
            break
        }
    } catch {
        if ($i -eq 30) {
            Write-Host "  ✗ Server failed to start"
            Stop-Process -Id $DevServerProcess.Id -Force -ErrorAction SilentlyContinue
            exit 1
        }
        Write-Host "  Waiting for server... ($i/30)"
        Start-Sleep -Seconds 1
    }
}

if (-not $Ready) {
    Write-Host "  ✗ Server failed to start"
    Stop-Process -Id $DevServerProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Step 4: Run tests
Write-Host "[4/5] Running Jest tests..."
Push-Location $ProjectDir
npm test -- --coverage --forceExit 2>&1 | Tee-Object -FilePath (Join-Path $LogDir "test_${Timestamp}.log")
$TestExitCode = $LASTEXITCODE
Pop-Location

# Step 5: Verify server is accessible
Write-Host "[5/5] Verifying server is accessible..."
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction Stop
    $HttpStatus = $Response.StatusCode
    Write-Host "  ✓ Server returned HTTP $HttpStatus"
} catch {
    $HttpStatus = "FAILED"
    Write-Host "  ✗ Server not accessible"
}

# Generate result summary
$ResultFile = Join-Path $ResultsDir "results_post_${Timestamp}.json"
$Status = if ($TestExitCode -eq 0) { "PASSED" } else { "FAILED" }
$ResultJson = @{
    project = "Project_B_ImprovedLivePanel"
    timestamp = $Timestamp
    status = $Status
    server_status = $HttpStatus
    test_exit_code = $TestExitCode
    test_log = (Join-Path $LogDir "test_${Timestamp}.log")
    server_log = (Join-Path $LogDir "server_${Timestamp}.log")
    features_tested = @(
        "clear_status_area",
        "tab_navigation",
        "tab_switching",
        "program_interaction_tab",
        "live_wall_tab",
        "queue_tab",
        "responsive_layout",
        "accessibility_features",
        "weak_network_handling",
        "proper_visual_hierarchy",
        "touch_target_sizing",
        "keyboard_navigation",
        "aria_attributes"
    )
    improvements = @(
        "clear_separation_of_status_vs_actions",
        "tabbed_interface",
        "better_information_hierarchy",
        "responsive_mobile_first_design",
        "accessibility_compliance",
        "weak_network_friendly_patterns",
        "visual_feedback_mechanisms",
        "improved_error_handling"
    )
    notes = "Improved version with comprehensive UI/UX enhancements, Tailwind CSS, and accessibility features"
} | ConvertTo-Json -Depth 10

$ResultJson | Out-File -FilePath $ResultFile -Encoding UTF8
Write-Host "  ✓ Results saved to $ResultFile"

# Cleanup
Write-Host ""
Write-Host "Shutting down development server..."
Stop-Process -Id $DevServerProcess.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=========================================="
Write-Host "Test run completed"
Write-Host "Exit code: $TestExitCode"
Write-Host "=========================================="

exit $TestExitCode
