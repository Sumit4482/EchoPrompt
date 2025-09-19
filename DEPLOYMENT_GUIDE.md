# 🚀 EchoPrompt Deployment Guide

## Overview
This guide covers deploying your EchoPrompt application for **FREE** without requiring a credit card.

## 🎯 Recommended Deployment Strategy

### **Option 1: Vercel + Render + MongoDB Atlas (Recommended)**

#### Frontend (Vercel)
1. **Sign up** at [vercel.com](https://vercel.com) (no credit card required)
2. **Connect** your GitHub repository
3. **Configure** build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### Backend (Render)
1. **Sign up** at [render.com](https://render.com) (no credit card required)
2. **Create** a new Web Service
3. **Connect** your GitHub repository
4. **Configure** settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

#### Database (MongoDB Atlas)
1. **Sign up** at [mongodb.com/atlas](https://mongodb.com/atlas) (no credit card required)
2. **Create** a free cluster (M0 Sandbox)
3. **Get** connection string
4. **Add** to Render environment variables

---

### **Option 2: Netlify + Render + MongoDB Atlas**

#### Frontend (Netlify)
1. **Sign up** at [netlify.com](https://netlify.com) (no credit card required)
2. **Connect** your GitHub repository
3. **Configure** build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`

#### Backend & Database
Same as Option 1

---

### **Option 3: All-in-One on Render**

1. **Sign up** at [render.com](https://render.com)
2. **Deploy** both frontend and backend
3. **Use** Render's free PostgreSQL database
4. **Configure** environment variables

---

## 🔧 Environment Variables Setup

### Backend Environment Variables (Render)
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echoprompt
JWT_SECRET=your-jwt-secret-here
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend Environment Variables (Vercel/Netlify)
```bash
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## 📁 Required Files

### 1. Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-backend-url.onrender.com"
  }
}
```

### 2. Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.onrender.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_URL = "https://your-backend-url.onrender.com"
```

### 3. Render Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: echoprompt-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        fromDatabase:
          name: echoprompt-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false

  - type: web
    name: echoprompt-frontend
    env: static
    plan: free
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://echoprompt-backend.onrender.com

databases:
  - name: echoprompt-db
    plan: free
    databaseName: echoprompt
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository
1. **Commit** all changes to GitHub
2. **Ensure** all configuration files are in place
3. **Test** locally with `npm run build`

### Step 2: Deploy Backend (Render)
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. **Connect** your GitHub repository
4. **Select** your repository
5. **Configure**:
   - Name: `echoprompt-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. **Add** environment variables
7. **Deploy**

### Step 3: Deploy Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. **Import** your GitHub repository
4. **Configure**:
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave empty)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add** environment variable: `VITE_API_URL`
6. **Deploy**

### Step 4: Set Up Database (MongoDB Atlas)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create** a free account
3. **Create** a new cluster (M0 Sandbox)
4. **Create** a database user
5. **Whitelist** your IP address (or use 0.0.0.0/0 for all)
6. **Get** connection string
7. **Add** to Render environment variables

---

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Solution**: Update CORS configuration in `backend/src/server.ts`
- **Add** your frontend URL to allowed origins

#### 2. Environment Variables Not Working
- **Solution**: Ensure variables are prefixed correctly
- **Frontend**: Use `VITE_` prefix
- **Backend**: Use exact variable names

#### 3. Build Failures
- **Solution**: Check build logs for specific errors
- **Common**: Missing dependencies, TypeScript errors

#### 4. Database Connection Issues
- **Solution**: Verify MongoDB Atlas connection string
- **Check**: IP whitelist, database user permissions

---

## 📊 Platform Limits & Considerations

### Vercel Free Tier
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth/month
- ✅ 100 serverless functions
- ⚠️ 10-second function timeout

### Render Free Tier
- ✅ 750 hours/month
- ✅ 512MB RAM
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Slower cold starts

### MongoDB Atlas Free Tier
- ✅ 512MB storage
- ✅ Shared clusters
- ✅ Automatic backups
- ⚠️ Limited to 100 connections

---

## 🎉 Success Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database connected and working
- [ ] API endpoints responding
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Custom domain configured (optional)

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:
- **Push** to main branch triggers deployment
- **Preview** deployments for pull requests
- **Rollback** to previous versions if needed

---

## 💡 Pro Tips

1. **Monitor** your usage to stay within free limits
2. **Use** environment variables for all sensitive data
3. **Test** locally before deploying
4. **Keep** your dependencies updated
5. **Use** proper error handling and logging

---

## 🆘 Support

If you encounter issues:
1. **Check** platform documentation
2. **Review** build logs
3. **Test** locally first
4. **Ask** in community forums

---

**Happy Deploying! 🚀**
