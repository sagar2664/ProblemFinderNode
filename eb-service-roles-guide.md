# Elastic Beanstalk Service Roles Setup

## If you still get permission errors after adding policies, you may need service roles:

### 1. Create EB Service Role
In AWS Console → IAM → Roles → Create role:
- **Use case**: Elastic Beanstalk
- **Permissions**: AWSElasticBeanstalkEnhancedHealth, AWSElasticBeanstalkService
- **Role name**: aws-elasticbeanstalk-service-role

### 2. Create EC2 Instance Profile  
In AWS Console → IAM → Roles → Create role:
- **Use case**: EC2
- **Permissions**: 
  - AWSElasticBeanstalkWebTier
  - AWSElasticBeanstalkWorkerTier
  - AWSElasticBeanstalkMulticontainerDocker
- **Role name**: aws-elasticbeanstalk-ec2-role

### 3. Use EB CLI with Specific Service Role
```bash
eb init --service-role aws-elasticbeanstalk-service-role
```

## Quick Fix Commands (if permissions are working):
```bash
# Initialize EB in your backend directory
cd backend
eb init

# When prompted:
# - Application name: problem-finder-api
# - Platform: Node.js
# - Version: Node.js 18 running on 64bit Amazon Linux 2
# - CodeCommit: No
# - SSH: Yes (optional)
```

