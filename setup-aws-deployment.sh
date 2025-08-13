#!/bin/bash

# AWS Deployment Setup Script for Problem Finder API
# This script helps set up the initial deployment configuration

echo "🚀 Setting up AWS deployment for Problem Finder API..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   - Windows: Download from AWS website"
    echo "   - macOS: brew install awscli" 
    echo "   - Linux: sudo apt-get install awscli"
    exit 1
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI is not installed. Installing..."
    pip install awsebcli
fi

echo "✅ Prerequisites checked!"

# Make deployment scripts executable
chmod +x deploy-backend.sh
chmod +x deploy-frontend.sh

echo "✅ Deployment scripts made executable!"

# Create .gitignore updates
echo "
# AWS Deployment files
.elasticbeanstalk/*
!.elasticbeanstalk/*.cfg.yml
!.elasticbeanstalk/*.global.yml
backend/.elasticbeanstalk/*
frontend/.env.production
" >> .gitignore

echo "✅ Updated .gitignore for AWS deployment files"

echo ""
echo "🎯 Next steps:"
echo "1. Configure AWS CLI: aws configure"
echo "2. Follow the AWS_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "3. Deploy backend: ./deploy-backend.sh"
echo "4. Deploy frontend: ./deploy-frontend.sh"
echo ""
echo "📖 See AWS_DEPLOYMENT_GUIDE.md for complete instructions!"
