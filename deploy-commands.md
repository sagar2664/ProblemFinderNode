# AWS Elastic Beanstalk Deployment Commands (Without EB CLI)

## Prerequisites
```bash
aws configure
# Set your AWS credentials, region, and output format
```

## Basic EB Operations Using AWS CLI

### 1. List Applications
```bash
aws elasticbeanstalk describe-applications
```

### 2. Create Application
```bash
aws elasticbeanstalk create-application \
    --application-name nodejs-problem-finder \
    --description "Problem Finder API and Frontend"
```

### 3. Create Environment
```bash
aws elasticbeanstalk create-environment \
    --application-name nodejs-problem-finder \
    --environment-name nodejs-problem-finder-env \
    --solution-stack-name "64bit Amazon Linux 2 v5.8.4 running Node.js 18" \
    --option-settings Namespace=aws:autoscaling:launchconfiguration,OptionName=InstanceType,Value=t3.micro
```

### 4. Package and Deploy Your App

#### For Backend (Node.js API):
```bash
# 1. Create a zip file of your backend
cd backend
zip -r ../backend-app.zip . -x "node_modules/*" "*.log"

# 2. Upload to S3 (create bucket first if needed)
aws s3 mb s3://your-app-deployment-bucket
aws s3 cp ../backend-app.zip s3://your-app-deployment-bucket/

# 3. Create application version
aws elasticbeanstalk create-application-version \
    --application-name nodejs-problem-finder \
    --version-label backend-v1.0 \
    --source-bundle S3Bucket=your-app-deployment-bucket,S3Key=backend-app.zip

# 4. Deploy to environment
aws elasticbeanstalk update-environment \
    --environment-name nodejs-problem-finder-env \
    --version-label backend-v1.0
```

#### For Frontend (React):
```bash
# 1. Build the React app
cd frontend-react
npm run build

# 2. Deploy to S3 + CloudFront (for static hosting)
aws s3 mb s3://your-frontend-bucket
aws s3 sync build/ s3://your-frontend-bucket --delete
aws s3 website s3://your-frontend-bucket --index-document index.html
```

### 5. Monitor Deployment
```bash
# Check environment status
aws elasticbeanstalk describe-environments \
    --environment-names nodejs-problem-finder-env

# View recent events
aws elasticbeanstalk describe-events \
    --environment-name nodejs-problem-finder-env \
    --max-records 20
```

### 6. Environment Management
```bash
# Terminate environment
aws elasticbeanstalk terminate-environment \
    --environment-name nodejs-problem-finder-env

# Delete application
aws elasticbeanstalk delete-application \
    --application-name nodejs-problem-finder
```

## Alternative: Use AWS Amplify for Full-Stack Deployment

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## Alternative: Use Docker + AWS App Runner

Create `Dockerfile` in your backend:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Deploy to AWS App Runner via Console or CLI:
```bash
aws apprunner create-service \
    --service-name nodejs-problem-finder \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "your-ecr-repo:latest",
            "ImageConfiguration": {
                "Port": "3000"
            },
            "ImageRepositoryType": "ECR"
        },
        "AutoDeploymentsEnabled": true
    }'
```


