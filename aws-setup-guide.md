# AWS CLI Configuration Guide

## After Creating Your Access Keys

### Configure AWS CLI with your new keys:

```bash
aws configure
```

When prompted, enter:
- **AWS Access Key ID**: [Your new access key ID]
- **AWS Secret Access Key**: [Your new secret access key]
- **Default region name**: us-east-1 (or your preferred region)
- **Default output format**: json

### Verify Configuration:

```bash
# Check current configuration
aws configure list

# Test access
aws sts get-caller-identity
```

### Alternative: Set Environment Variables

Instead of `aws configure`, you can set environment variables:

#### Windows (PowerShell):
```powershell
$env:AWS_ACCESS_KEY_ID="your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY="your-secret-access-key"
$env:AWS_DEFAULT_REGION="us-east-1"
```

#### Windows (Command Prompt):
```cmd
set AWS_ACCESS_KEY_ID=your-access-key-id
set AWS_SECRET_ACCESS_KEY=your-secret-access-key
set AWS_DEFAULT_REGION=us-east-1
```

### Configuration File Location:
- Windows: `C:\Users\{username}\.aws\credentials`
- The file should look like:
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
region = us-east-1
```

## Important Security Notes:
1. **Never share your secret access key**
2. **Don't commit keys to version control (Git)**
3. **Use environment variables or AWS profiles for different projects**
4. **Rotate keys regularly for security**
5. **Delete old/unused access keys**

## If You Need to Create a New IAM User:

1. In IAM Console, click **"Users"** → **"Add user"**
2. Enter username and select **"Programmatic access"**
3. Attach policies:
   - `AWSElasticBeanstalkFullAccess` (for EB CLI)
   - `AmazonS3FullAccess` (for deployments)
   - Or create custom policy with minimum required permissions
4. Complete the wizard and save the generated access keys

## Testing Your Setup:

```bash
# Test basic AWS access
aws sts get-caller-identity

# Test Elastic Beanstalk access
aws elasticbeanstalk describe-applications

# Test S3 access
aws s3 ls
```

