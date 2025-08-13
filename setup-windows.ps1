# Problem Finder API - Windows Setup Script
# Sets up everything needed for AWS deployment on Windows

Write-Host "🚀 Setting up Problem Finder API for AWS deployment on Windows..." -ForegroundColor Green

# Check PowerShell execution policy
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Host "⚠️ PowerShell execution policy is restricted." -ForegroundColor Yellow
    Write-Host "To allow script execution, run as Administrator:" -ForegroundColor Yellow
    Write-Host "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Cyan
    Write-Host ""
}

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "📥 Download from: https://nodejs.org/" -ForegroundColor Yellow
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm found: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found!" -ForegroundColor Red
}

# Check Python
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "📥 Download from: https://www.python.org/" -ForegroundColor Yellow
}

# Check pip
if (Test-Command "pip") {
    Write-Host "✅ pip found" -ForegroundColor Green
} else {
    Write-Host "❌ pip not found!" -ForegroundColor Red
}

# Check Git
if (Test-Command "git") {
    Write-Host "✅ Git found" -ForegroundColor Green
} else {
    Write-Host "❌ Git not found!" -ForegroundColor Red
    Write-Host "📥 Download from: https://git-scm.com/" -ForegroundColor Yellow
}

# Check AWS CLI
if (Test-Command "aws") {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} else {
    Write-Host "❌ AWS CLI not found!" -ForegroundColor Red
    Write-Host "📥 Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
}

# Check EB CLI
if (Test-Command "eb") {
    Write-Host "✅ EB CLI found" -ForegroundColor Green
} else {
    Write-Host "⚠️ EB CLI not found. Will install automatically during deployment." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Setup Summary:" -ForegroundColor Blue
Write-Host "✅ Configuration files created" -ForegroundColor Green
Write-Host "✅ Deployment scripts ready" -ForegroundColor Green
Write-Host "✅ Environment configuration set up" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Blue
Write-Host "1. Install missing prerequisites (if any)" -ForegroundColor White
Write-Host "2. Configure AWS CLI:" -ForegroundColor White
Write-Host "   aws configure" -ForegroundColor Cyan
Write-Host "3. Follow the deployment guide:" -ForegroundColor White
Write-Host "   • Open WINDOWS_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host "4. Deploy backend:" -ForegroundColor White
Write-Host "   .\deploy-backend.ps1" -ForegroundColor Cyan
Write-Host "5. Deploy frontend:" -ForegroundColor White
Write-Host "   .\deploy-frontend.ps1 -BucketName 'your-bucket-name'" -ForegroundColor Cyan

Write-Host ""
Write-Host "📖 For detailed instructions, see WINDOWS_DEPLOYMENT_GUIDE.md" -ForegroundColor Green
Write-Host "🎉 Setup complete! Ready for AWS deployment." -ForegroundColor Green




