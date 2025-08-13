#!/bin/bash

# Problem Finder API - Backend Deployment Script for AWS Elastic Beanstalk

echo "🚀 Starting backend deployment to AWS Elastic Beanstalk..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI is not installed. Please install it first:"
    echo "pip install awsebcli"
    exit 1
fi

# Navigate to backend directory
cd backend

# Create application version
echo "📦 Creating application version..."
zip -r ../problem-finder-backend-$(date +%Y%m%d-%H%M%S).zip . -x "node_modules/*" ".git/*" "*.log"

echo "✅ Backend deployment package created!"
echo "📋 Next steps:"
echo "1. Go to AWS Elastic Beanstalk Console"
echo "2. Create a new application called 'problem-finder-api'"
echo "3. Create a new environment with Node.js platform"
echo "4. Upload the zip file created above"
echo "5. Set environment variables if needed"

cd ..
