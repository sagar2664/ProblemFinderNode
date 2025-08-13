# 🚀 Windows Deployment Guide - Problem Finder API on AWS

This guide provides Windows-specific steps to deploy your Node.js Problem Finder API to AWS.

## 📋 Prerequisites for Windows

1. **Windows PowerShell** (built-in) or **PowerShell 7+**
2. **Node.js** (v18+) - Download from [nodejs.org](https://nodejs.org/)
3. **Python** (for EB CLI) - Download from [python.org](https://www.python.org/)
4. **Git for Windows** - Download from [git-scm.com](https://git-scm.com/)

## 🔧 Step 1: Install Required Tools

### Install AWS CLI (Windows)

1. **Download AWS CLI installer**:
   - Go to: https://aws.amazon.com/cli/
   - Download "AWS CLI MSI installer for Windows (64-bit)"

2. **Run the installer** and follow the setup wizard

3. **Verify installation**:
   ```powershell
   aws --version
   ```

### Install EB CLI (Elastic Beanstalk CLI)

1. **Install Python** (if not already installed)
2. **Open PowerShell as Administrator**
3. **Install EB CLI**:
   ```powershell
   pip install awsebcli
   ```

4. **Verify installation**:
   ```powershell
   eb --version
   ```

### Configure AWS CLI

```powershell
aws configure
```

Enter your AWS credentials:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key  
- **Default region name**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

## 🏗️ Step 2: Deploy Backend (Elastic Beanstalk)

### Navigate to Backend Directory

```powershell
cd backend
```

### Initialize Elastic Beanstalk

```powershell
eb init
```

**Follow the prompts**:
1. Select region: `10) us-east-1 : US East (N. Virginia)`
2. Application name: `problem-finder-api`
3. Platform: `Node.js`
4. Platform version: Select latest Node.js 18.x
5. SSH setup: `Y` (recommended)
6. Keypair: Create new or select existing

### Create Environment

```powershell
eb create production
```

**Configuration**:
- Environment name: `production`
- DNS CNAME: `problem-finder-api-prod` (or your choice)
- Load balancer: `2) application`

### Deploy Application

```powershell
eb deploy
```

### Get Backend URL

```powershell
eb status
```

**Copy the Environment URL** (something like: `http://production.xxxxxxxx.us-east-1.elasticbeanstalk.com`)

## 🌐 Step 3: Deploy Frontend (S3 + CloudFront)

### Navigate to Frontend Directory

```powershell
cd ..\frontend
```

### Update Environment Configuration

1. **Edit `.env.production` file**:
   ```
   REACT_APP_API_URL=http://your-actual-backend-url.elasticbeanstalk.com
   REACT_APP_ENVIRONMENT=production
   ```
   
   Replace with your actual backend URL from Step 2.

### Build the Application

```powershell
npm install
npm run build
```

### Create S3 Bucket (via AWS Console)

1. **Go to AWS S3 Console**: https://s3.console.aws.amazon.com/
2. **Click "Create bucket"**
3. **Bucket settings**:
   - Bucket name: `problem-finder-frontend-yourname` (must be globally unique)
   - Region: Same as backend (e.g., us-east-1)
   - **Uncheck** "Block all public access"
   - Check the acknowledgment box
4. **Click "Create bucket"**

### Configure S3 for Website Hosting

1. **Select your bucket** → **Properties** tab
2. **Scroll to "Static website hosting"** → **Edit**
3. **Enable static website hosting**:
   - Index document: `index.html`
   - Error document: `index.html`
4. **Save changes**

### Set Bucket Policy

1. **Permissions** tab → **Bucket Policy** → **Edit**
2. **Paste this policy** (replace `YOUR_BUCKET_NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

### Upload Build Files to S3

```powershell
# Navigate to build folder
cd build

# Upload all files
aws s3 sync . s3://YOUR_BUCKET_NAME --delete

# Set correct content types
aws s3 cp . s3://YOUR_BUCKET_NAME --recursive --exclude "*" --include "*.js" --content-type="application/javascript"
aws s3 cp . s3://YOUR_BUCKET_NAME --recursive --exclude "*" --include "*.css" --content-type="text/css"
aws s3 cp . s3://YOUR_BUCKET_NAME --recursive --exclude "*" --include "*.html" --content-type="text/html"
```

### Get S3 Website URL

1. **Go to S3 bucket** → **Properties** → **Static website hosting**
2. **Copy the "Bucket website endpoint"**

## 🚀 Step 4: Setup CloudFront (Optional but Recommended)

### Create CloudFront Distribution

1. **Go to CloudFront Console**: https://console.aws.amazon.com/cloudfront/
2. **Click "Create distribution"**
3. **Configuration**:
   - **Origin Domain**: Paste your S3 website endpoint (without http://)
   - **Default Cache Behavior**: 
     - Viewer Protocol Policy: "Redirect HTTP to HTTPS"
   - **Default Root Object**: `index.html`
4. **Click "Create distribution"**

### Configure Error Pages (for React Router)

1. **After distribution is created**, click on it
2. **Error Pages** tab → **Create Custom Error Response**
3. **Add these error responses**:
   - HTTP Error Code: `403`, Response Page Path: `/index.html`, HTTP Response Code: `200`
   - HTTP Error Code: `404`, Response Page Path: `/index.html`, HTTP Response Code: `200`

### Wait for Deployment

CloudFront takes 15-20 minutes to deploy. Check the status in the console.

## 🔄 Step 5: Create Deployment Scripts (Windows)

### Backend Deployment Script

Create `deploy-backend.ps1`:

```powershell
# Backend deployment script
Write-Host "🚀 Deploying backend to AWS Elastic Beanstalk..." -ForegroundColor Green

Set-Location backend
eb deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
    eb status
} else {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
}

Set-Location ..
```

### Frontend Deployment Script

Create `deploy-frontend.ps1`:

```powershell
# Frontend deployment script
param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [string]$DistributionId = ""
)

Write-Host "🚀 Deploying frontend to AWS S3..." -ForegroundColor Green

Set-Location frontend

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Upload to S3
    Write-Host "📤 Uploading to S3..." -ForegroundColor Yellow
    Set-Location build
    aws s3 sync . s3://$BucketName --delete
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Upload successful!" -ForegroundColor Green
        
        # Invalidate CloudFront cache if distribution ID provided
        if ($DistributionId -ne "") {
            Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
            aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
        }
        
        Write-Host "🎉 Frontend deployment complete!" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed!" -ForegroundColor Red
    }
    
    Set-Location ..
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}

Set-Location ..
```

### Make Scripts Executable

```powershell
# Allow PowerShell script execution (run as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎯 Step 6: Deploy Your Application

### Deploy Backend

```powershell
.\deploy-backend.ps1
```

### Deploy Frontend

```powershell
# Replace with your actual bucket name
.\deploy-frontend.ps1 -BucketName "your-bucket-name"

# If you have CloudFront distribution ID:
.\deploy-frontend.ps1 -BucketName "your-bucket-name" -DistributionId "YOUR_DISTRIBUTION_ID"
```

## ✅ Step 7: Test Your Deployment

### Test Backend

```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://your-backend-url.elasticbeanstalk.com/health"

# Test search endpoint
Invoke-RestMethod -Uri "http://your-backend-url.elasticbeanstalk.com/?q=sorting"
```

### Test Frontend

1. **Open your S3 website URL** or **CloudFront URL** in browser
2. **Test search functionality**
3. **Verify API calls are working**

## 🚨 Troubleshooting (Windows)

### Common Issues

1. **PowerShell Execution Policy**:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **AWS CLI not found**:
   - Restart PowerShell after AWS CLI installation
   - Check PATH environment variable

3. **EB CLI installation issues**:
   ```powershell
   # If pip not found, install Python first
   # Then try:
   python -m pip install awsebcli
   ```

4. **Node.js/npm issues**:
   ```powershell
   # Check versions
   node --version
   npm --version
   
   # Clear npm cache if needed
   npm cache clean --force
   ```

### Check Logs

**Backend logs**:
```powershell
cd backend
eb logs
```

**Frontend build issues**:
```powershell
cd frontend
npm run build 2>&1 | Tee-Object -FilePath build-log.txt
```

## 🎉 Deployment Complete!

Your Problem Finder API is now live on AWS!

- **Backend**: Your Elastic Beanstalk URL
- **Frontend**: Your S3/CloudFront URL

### Quick Commands Summary

```powershell
# Deploy backend
cd backend && eb deploy

# Deploy frontend  
cd frontend && npm run build && cd build && aws s3 sync . s3://YOUR_BUCKET_NAME --delete

# Check backend status
cd backend && eb status

# View backend logs
cd backend && eb logs
```

### Cost Monitoring

- Monitor costs in AWS Billing Dashboard
- Set up billing alerts
- Expected cost: $20-50/month for small-medium traffic

🎯 **Your Problem Finder API is now running on AWS with global CDN delivery!**
