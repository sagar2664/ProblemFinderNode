# 🚀 AWS Deployment Guide - Problem Finder API

This guide will walk you through deploying your Node.js Problem Finder API backend and React frontend on AWS.

## 📋 Prerequisites

Before starting, ensure you have:

1. **AWS Account** with administrative permissions
2. **AWS CLI** installed and configured
3. **Node.js** (v18+) and **npm** installed locally
4. **Git** installed
5. **EB CLI** (Elastic Beanstalk CLI) - Install with: `pip install awsebcli`

## 🏗️ Architecture Overview

- **Backend**: AWS Elastic Beanstalk (Node.js platform)
- **Frontend**: AWS S3 + CloudFront
- **Domain**: Route 53 (optional)
- **SSL**: AWS Certificate Manager (optional)

---

## 🔧 Part 1: Backend Deployment (Elastic Beanstalk)

### Step 1: Install AWS CLI and EB CLI

```bash
# Install AWS CLI (if not already installed)
# Windows: Download from AWS website
# macOS: brew install awscli
# Linux: sudo apt-get install awscli

# Configure AWS CLI
aws configure
# Enter your Access Key ID, Secret Access Key, Region (e.g., us-east-1), and output format (json)

# Install EB CLI
pip install awsebcli
```

### Step 2: Prepare Backend for Deployment

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Initialize Elastic Beanstalk**:
   ```bash
   eb init
   ```
   - Select your region (e.g., us-east-1)
   - Choose "Create new application" and name it `problem-finder-api`
   - Select Node.js platform
   - Choose the latest Node.js version (18.x)
   - Setup SSH? Yes (recommended)

3. **Create Environment**:
   ```bash
   eb create production
   ```
   - Environment name: `production`
   - DNS CNAME prefix: `problem-finder-api-prod` (or your preference)
   - Load balancer type: Application Load Balancer

### Step 3: Deploy Backend

```bash
# Deploy the application
eb deploy

# Check status
eb status

# View logs (if needed)
eb logs
```

### Step 4: Configure Environment Variables (if needed)

```bash
# Set environment variables
eb setenv NODE_ENV=production
eb setenv PORT=8081
```

### Step 5: Get Backend URL

```bash
# Get the URL of your deployed backend
eb status
```

Note down the URL (e.g., `http://problem-finder-api-prod.us-east-1.elasticbeanstalk.com`)

---

## 🌐 Part 2: Frontend Deployment (S3 + CloudFront)

### Step 1: Prepare Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Update environment variables**:
   - Edit `.env.production` file
   - Replace `https://your-backend-url.elasticbeanstalk.com` with your actual backend URL from Step 5 above

3. **Build the application**:
   ```bash
   npm install
   npm run build
   ```

### Step 2: Create S3 Bucket

1. **Go to AWS S3 Console**
2. **Create bucket**:
   - Bucket name: `problem-finder-frontend` (must be globally unique)
   - Region: Same as your backend (e.g., us-east-1)
   - Uncheck "Block all public access"
   - Create bucket

### Step 3: Configure S3 for Static Website Hosting

1. **Select your bucket** → **Properties** tab
2. **Scroll to "Static website hosting"**
3. **Enable static website hosting**:
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)

### Step 4: Set Bucket Policy

1. **Go to "Permissions" tab** → **Bucket Policy**
2. **Add this policy** (replace `YOUR_BUCKET_NAME`):

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

### Step 5: Upload Build Files

**Using AWS CLI**:
```bash
# Navigate to build directory
cd build

# Sync files to S3
aws s3 sync . s3://YOUR_BUCKET_NAME --delete

# Set proper MIME types
aws s3 cp . s3://YOUR_BUCKET_NAME --recursive --exclude "*" --include "*.js" --content-type="application/javascript"
aws s3 cp . s3://YOUR_BUCKET_NAME --recursive --exclude "*" --include "*.css" --content-type="text/css"
```

**Or manually**:
1. Go to S3 bucket → **Objects** tab
2. **Upload** all files from `build` directory

### Step 6: Setup CloudFront (Recommended)

1. **Go to CloudFront Console**
2. **Create Distribution**:
   - Origin Domain: Your S3 bucket website endpoint
   - Default Cache Behavior: Redirect HTTP to HTTPS
   - Price Class: Use all edge locations (or choose based on your needs)
   - Default Root Object: `index.html`

3. **Custom Error Pages** (for React Router):
   - Error Code: 403, 404
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

4. **Wait for deployment** (15-20 minutes)

---

## 🔄 Part 3: Automated Deployment Scripts

### Backend Deployment Script

Create `deploy-backend.sh`:
```bash
#!/bin/bash
cd backend
eb deploy
echo "✅ Backend deployed successfully!"
eb status
```

### Frontend Deployment Script

Create `deploy-frontend.sh`:
```bash
#!/bin/bash
cd frontend
npm run build
aws s3 sync build/ s3://YOUR_BUCKET_NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
echo "✅ Frontend deployed successfully!"
```

Make scripts executable:
```bash
chmod +x deploy-backend.sh
chmod +x deploy-frontend.sh
```

---

## 🔒 Part 4: Security & Production Setup

### Backend Security

1. **Environment Variables**: Set in EB Console
2. **CORS Configuration**: Update in `server.js` to only allow your frontend domain
3. **Rate Limiting**: Consider adding rate limiting middleware

### Frontend Security

1. **HTTPS**: CloudFront provides HTTPS automatically
2. **Environment Variables**: Use `.env.production` for production settings

---

## 🎯 Part 5: Custom Domain (Optional)

### Step 1: Register Domain in Route 53

1. **Go to Route 53 Console**
2. **Register domain** or **transfer existing domain**

### Step 2: Get SSL Certificate

1. **Go to Certificate Manager**
2. **Request certificate** for your domain
3. **Validate domain ownership**

### Step 3: Configure CloudFront

1. **Edit CloudFront distribution**
2. **Add Alternate Domain Name** (CNAME)
3. **Select SSL Certificate**

### Step 4: Update Route 53

1. **Create A record** pointing to CloudFront distribution
2. **Create CNAME** for www subdomain (optional)

---

## 📊 Part 6: Monitoring & Maintenance

### Monitoring

1. **CloudWatch**: Monitor application metrics
2. **EB Health Dashboard**: Monitor backend health
3. **CloudFront Metrics**: Monitor CDN performance

### Regular Maintenance

1. **Update dependencies** regularly
2. **Monitor costs** in AWS Billing Dashboard
3. **Backup data** if you add database later
4. **Update SSL certificates** (auto-renewal with ACM)

---

## 🚨 Troubleshooting

### Common Backend Issues

1. **Application not starting**:
   ```bash
   eb logs
   ```

2. **Port issues**: Ensure your app listens on `process.env.PORT`

3. **Dependencies**: Check `package.json` and install all dependencies

### Common Frontend Issues

1. **404 errors**: Ensure error pages redirect to `index.html`
2. **API calls failing**: Check CORS settings and API URL
3. **Static files not loading**: Check MIME types in S3

### Testing Deployment

1. **Backend**: Test API endpoints
   ```bash
   curl https://your-backend-url.elasticbeanstalk.com/health
   ```

2. **Frontend**: Open in browser and test functionality

---

## 💰 Cost Estimation

### Monthly Costs (approximate):

- **Elastic Beanstalk**: $15-30 (t3.micro instance)
- **S3**: $1-5 (storage and requests)
- **CloudFront**: $1-10 (data transfer)
- **Route 53**: $0.50 per hosted zone + $0.40 per million queries
- **Total**: ~$20-50/month for small to medium traffic

---

## 🎉 Deployment Complete!

Your Problem Finder API is now live on AWS! 

- **Backend URL**: Your Elastic Beanstalk URL
- **Frontend URL**: Your CloudFront or S3 website URL

### Next Steps:

1. **Test all functionality**
2. **Set up monitoring alerts**
3. **Configure automated backups**
4. **Consider adding a database** (RDS) for persistence
5. **Set up CI/CD pipeline** for automated deployments

---

## 📞 Support

If you encounter issues:

1. Check AWS documentation
2. Review CloudWatch logs
3. Test locally first
4. Verify all environment variables
5. Check security groups and IAM permissions

Happy coding! 🚀
