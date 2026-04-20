# Baskaro Backend API Testing Script

$BASE_URL = "http://localhost:4001/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Baskaro Backend API Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1] Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode) - OK" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)`n" -ForegroundColor Gray
} catch {
    Write-Host "   FAILED: $_`n" -ForegroundColor Red
}

# Test 2: Register User
Write-Host "[2] User Registration" -ForegroundColor Yellow
$testEmail = "test$(Get-Random -Maximum 9999)@example.com"
$body = @"
{
  "name": "Test User",
  "email": "$testEmail",
  "phone": "9876543210",
  "password": "password123"
}
"@

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/auth/email/register" `
        -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode) - OK" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    if ($result.token) {
        $JWT_TOKEN = $result.token
        Write-Host "   Token received successfully`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAILED: $_`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Basic tests completed!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
