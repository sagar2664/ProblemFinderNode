# Problem Finder API - Backend Deployment Script for Windows
# Deploys Node.js backend to AWS Elastic Beanstalk

Write-Host "🚀 Starting backend deployment to AWS Elastic Beanstalk..." -ForegroundColor Green

# Check if AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if EB CLI is available
try {
    eb --version | Out-Null
    Write-Host "✅ EB CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ EB CLI not found. Installing..." -ForegroundColor Yellow
    pip install awsebcli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EB CLI. Please install manually:" -ForegroundColor Red
        Write-Host "pip install awsebcli" -ForegroundColor Yellow
        exit 1
    }
}

# Navigate to backend directory
if (Test-Path "backend") {
    Set-Location backend
    Write-Host "📁 Moved to backend directory" -ForegroundColor Blue
} else {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Deploy to Elastic Beanstalk
Write-Host "📦 Deploying to Elastic Beanstalk..." -ForegroundColor Yellow
eb deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    Write-Host "📋 Deployment Status:" -ForegroundColor Blue
    eb status
    Write-Host "" 
    Write-Host "🌍 Your API is now live!" -ForegroundColor Green
    Write-Host "Test it with: Invoke-RestMethod -Uri 'http://your-url.elasticbeanstalk.com/health'" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    Write-Host "📋 Check logs with: eb logs" -ForegroundColor Yellow
}

# Return to root directory
Set-Location ..
Write-Host "📁 Returned to root directory" -ForegroundColor Blue




