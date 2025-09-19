# 🗄️ MongoDB Atlas Setup Guide

## What You Need for MongoDB Atlas

### 1. **Account Setup**
- Go to [mongodb.com/atlas](https://mongodb.com/atlas)
- Click **"Try Free"**
- Sign up with email or Google (no credit card required)
- Verify your email address

### 2. **Create Free Cluster**

#### Step 1: Create New Cluster
1. Click **"Create"** or **"Build a Database"**
2. Choose **"M0 Sandbox"** (Free tier)
3. Select **"AWS"** as cloud provider
4. Choose **"US East (N. Virginia)"** region
5. Click **"Create Cluster"**

#### Step 2: Configure Database Access
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create username: `echoprompt-user`
5. Create password: `YourSecurePassword123!`
6. Set privileges: **"Read and write to any database"**
7. Click **"Add User"**

#### Step 3: Configure Network Access
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Add comment: "Render deployment"
5. Click **"Confirm"**

### 3. **Get Connection String**

#### Step 1: Get Connection URI
1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** driver
5. Copy the connection string

#### Step 2: Update Connection String
Replace `<password>` with your actual password:
```
mongodb+srv://echoprompt-user:YourSecurePassword123!@cluster0.xxxxx.mongodb.net/echoprompt?retryWrites=true&w=majority
```

### 4. **Database Configuration**

#### Create Database and Collections
Your app will automatically create these collections:
- `users` - User accounts and profiles
- `prompts` - Generated prompts
- `templates` - Prompt templates
- `userpreferences` - User settings
- `analytics` - Usage analytics

#### Sample Data (Optional)
You can add sample data using the seed script:
```bash
cd backend
npm run seed
```

### 5. **Environment Variables for Render**

Add this to your Render environment variables:
```bash
MONGODB_URI=mongodb+srv://echoprompt-user:YourSecurePassword123!@cluster0.xxxxx.mongodb.net/echoprompt?retryWrites=true&w=majority
```

### 6. **MongoDB Atlas Free Tier Limits**

#### What's Included:
- ✅ 512MB storage
- ✅ Shared clusters (M0)
- ✅ 100 connections
- ✅ Automatic backups
- ✅ Monitoring and alerts
- ✅ No credit card required

#### What's Not Included:
- ❌ Dedicated clusters
- ❌ Advanced security features
- ❌ Data lake
- ❌ Advanced analytics

### 7. **Security Best Practices**

#### Database User Security:
- Use strong passwords
- Limit database user privileges
- Regularly rotate passwords
- Monitor access logs

#### Network Security:
- Use specific IP addresses when possible
- Regularly review network access
- Enable audit logging

#### Application Security:
- Use environment variables for connection strings
- Never commit credentials to code
- Use connection pooling
- Implement proper error handling

### 8. **Monitoring & Maintenance**

#### Atlas Dashboard:
- **Overview**: Cluster status and metrics
- **Metrics**: Performance and usage statistics
- **Logs**: Database and application logs
- **Alerts**: Set up notifications

#### Key Metrics to Monitor:
- Storage usage (stay under 512MB)
- Connection count (stay under 100)
- Query performance
- Error rates

### 9. **Troubleshooting**

#### Common Issues:

**1. Connection Refused**
- Check network access settings
- Verify IP address whitelist
- Check connection string format

**2. Authentication Failed**
- Verify username and password
- Check database user privileges
- Ensure user exists in Atlas

**3. Database Not Found**
- Check database name in connection string
- Verify cluster is running
- Check if database exists

**4. Slow Queries**
- Check query performance in Atlas
- Add database indexes if needed
- Monitor connection count

#### Debug Commands:
```bash
# Test connection locally
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(err => console.error(err))"
```

### 10. **Backup & Recovery**

#### Automatic Backups:
- Atlas provides automatic backups
- Point-in-time recovery available
- Backup retention: 2 days (free tier)

#### Manual Backup:
```bash
# Export data (if needed)
mongodump --uri="your-connection-string" --out=./backup
```

---

## 🎯 Quick Start Checklist

- [ ] Sign up at mongodb.com/atlas
- [ ] Create M0 Sandbox cluster
- [ ] Create database user
- [ ] Configure network access
- [ ] Get connection string
- [ ] Test connection
- [ ] Add to Render environment variables
- [ ] Deploy and test

---

## 📞 Support
- **Documentation**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Community**: [community.mongodb.com](https://community.mongodb.com)
- **Status**: [status.mongodb.com](https://status.mongodb.com)

---

## 💡 Pro Tips

1. **Use Connection Pooling**: Set `maxPoolSize` in connection options
2. **Monitor Usage**: Keep an eye on storage and connection limits
3. **Index Optimization**: Add indexes for frequently queried fields
4. **Error Handling**: Implement proper error handling for database operations
5. **Environment Variables**: Never hardcode connection strings
