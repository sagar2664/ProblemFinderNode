#!/bin/bash

# Problem Finder API - Frontend Deployment Script for AWS S3 + CloudFront

echo "🚀 Starting frontend deployment to AWS S3 + CloudFront..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production build
echo "🔨 Building production version..."
npm run build

echo "✅ Frontend build completed!"
echo "📋 Build files are in the 'build' directory"
echo ""
echo "📋 Next steps for AWS deployment:"
echo "1. Create an S3 bucket for hosting"
echo "2. Enable static website hosting on the bucket"
echo "3. Upload the contents of the 'build' directory to S3"
echo "4. Set up CloudFront distribution (optional but recommended)"
echo "5. Configure custom domain (optional)"

cd ..
