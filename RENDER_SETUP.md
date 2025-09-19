# 🚀 Render Setup Guide

## What You Need for Render

### 1. **Account Setup**
- Go to [render.com](https://render.com)
- Sign up with GitHub (no credit card required)
- Verify your email address

### 2. **Repository Requirements**
- Your code must be on GitHub
- Repository must be public (for free tier)
- Main branch should have your latest code

### 3. **Backend Deployment on Render**

#### Step 1: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. **Connect** your GitHub repository
3. **Select** your repository: `emini-prompt-guide`

#### Step 2: Configure Backend Service
```
Name: echoprompt-backend
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm start
```

#### Step 3: Environment Variables
Add these environment variables in Render dashboard:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echoprompt
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

#### Step 4: Deploy
- Click **"Create Web Service"**
- Wait for deployment (5-10 minutes)
- Your backend will be available at: `https://echoprompt-backend.onrender.com`

### 4. **Frontend Deployment on Render (Alternative)**

#### Step 1: Create Static Site
1. Click **"New +"** → **"Static Site"**
2. **Connect** your GitHub repository
3. **Select** your repository: `emini-prompt-guide`

#### Step 2: Configure Frontend Service
```
Name: echoprompt-frontend
Branch: main
Root Directory: (leave empty)
Build Command: npm install && npm run build
Publish Directory: dist
```

#### Step 3: Environment Variables
```bash
VITE_API_URL=https://echoprompt-backend.onrender.com
```

### 5. **Render Free Tier Limits**
- ✅ 750 hours/month per service
- ✅ 512MB RAM per service
- ✅ Sleeps after 15 minutes of inactivity
- ✅ Automatic SSL certificates
- ✅ Custom domains supported
- ⚠️ Cold start takes 30-60 seconds when sleeping

### 6. **Troubleshooting Render Issues**

#### Common Problems:
1. **Build Fails**: Check build logs for missing dependencies
2. **Service Crashes**: Check environment variables
3. **Slow Response**: Service is sleeping, wait for cold start
4. **CORS Errors**: Update CORS settings in backend

#### Debug Commands:
```bash
# Check build logs
# Go to Render dashboard → Your service → Logs

# Check if service is running
curl https://echoprompt-backend.onrender.com/health
```

### 7. **Custom Domain Setup**
1. Go to your service settings
2. Click **"Custom Domains"**
3. Add your domain
4. Update DNS records as instructed
5. SSL certificate will be automatically provisioned

### 8. **Monitoring & Logs**
- **Logs**: Available in Render dashboard
- **Metrics**: CPU, Memory, Response time
- **Alerts**: Set up notifications for downtime

---

## 🎯 Quick Start Checklist

- [ ] Sign up at render.com
- [ ] Connect GitHub repository
- [ ] Create backend web service
- [ ] Add environment variables
- [ ] Deploy backend
- [ ] Test backend endpoint
- [ ] Create frontend static site (optional)
- [ ] Configure custom domain (optional)

---

## 📞 Support
- **Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)
