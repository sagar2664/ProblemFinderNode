# Problem Finder API - Frontend Deployment Script for Windows
# Deploys React frontend to AWS S3 + CloudFront

param(
    [Parameter(Mandatory=$true, HelpMessage="Enter your S3 bucket name")]
    [string]$BucketName,
    
    [Parameter(HelpMessage="Enter CloudFront Distribution ID (optional)")]
    [string]$DistributionId = ""
)

Write-Host "🚀 Starting frontend deployment to AWS S3..." -ForegroundColor Green
Write-Host "📦 Bucket: $BucketName" -ForegroundColor Blue

# Check if AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Navigate to frontend directory
if (Test-Path "frontend") {
    Set-Location frontend
    Write-Host "📁 Moved to frontend directory" -ForegroundColor Blue
} else {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists, install if not
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Build the application
Write-Host "🔨 Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Check if build directory exists
    if (Test-Path "build") {
        # Navigate to build directory
        Set-Location build
        
        # Upload to S3
        Write-Host "📤 Uploading files to S3 bucket: $BucketName..." -ForegroundColor Yellow
        aws s3 sync . s3://$BucketName --delete
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Upload successful!" -ForegroundColor Green
            
            # Set correct content types
            Write-Host "🔧 Setting content types..." -ForegroundColor Yellow
            aws s3 cp . s3://$BucketName --recursive --exclude "*" --include "*.js" --content-type="application/javascript" --metadata-directive="REPLACE"
            aws s3 cp . s3://$BucketName --recursive --exclude "*" --include "*.css" --content-type="text/css" --metadata-directive="REPLACE" 
            aws s3 cp . s3://$BucketName --recursive --exclude "*" --include "*.html" --content-type="text/html" --metadata-directive="REPLACE"
            
            # Invalidate CloudFront cache if distribution ID provided
            if ($DistributionId -ne "") {
                Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
                aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ CloudFront cache invalidated!" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ CloudFront invalidation failed, but files are uploaded" -ForegroundColor Yellow
                }
            }
            
            Write-Host ""
            Write-Host "🎉 Frontend deployment complete!" -ForegroundColor Green
            Write-Host "🌍 Your website should be live at:" -ForegroundColor Cyan
            Write-Host "S3 Website: http://$BucketName.s3-website-us-east-1.amazonaws.com" -ForegroundColor Cyan
            
            if ($DistributionId -ne "") {
                Write-Host "CloudFront: Check your distribution URL in AWS Console" -ForegroundColor Cyan
            }
            
        } else {
            Write-Host "❌ Upload to S3 failed!" -ForegroundColor Red
            Write-Host "💡 Make sure:" -ForegroundColor Yellow
            Write-Host "   - AWS CLI is configured (aws configure)" -ForegroundColor Yellow  
            Write-Host "   - S3 bucket exists and you have permissions" -ForegroundColor Yellow
            Write-Host "   - Bucket name is correct: $BucketName" -ForegroundColor Yellow
        }
        
        # Return to frontend directory
        Set-Location ..
    } else {
        Write-Host "❌ Build directory not found!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "💡 Check your package.json and fix any build errors" -ForegroundColor Yellow
}

# Return to root directory
Set-Location ..
Write-Host "📁 Returned to root directory" -ForegroundColor Blue

Write-Host ""
Write-Host "📋 Usage examples:" -ForegroundColor Blue
Write-Host "   .\deploy-frontend.ps1 -BucketName 'my-bucket-name'" -ForegroundColor Gray
Write-Host "   .\deploy-frontend.ps1 -BucketName 'my-bucket-name' -DistributionId 'E1234567890ABC'" -ForegroundColor Gray




