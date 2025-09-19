# 🔐 Environment Variables Guide

## Complete List of Required Environment Variables

### **Backend Environment Variables (Render)**

#### Required Variables:
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echoprompt
JWT_SECRET=your-super-secret-jwt-key-here
```

#### Optional Variables:
```bash
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Frontend Environment Variables (Netlify/Vercel)**

#### Required Variables:
```bash
VITE_API_URL=https://echoprompt-backend.onrender.com
```

#### Optional Variables:
```bash
VITE_APP_NAME=EchoPrompt
VITE_APP_VERSION=1.0.0
VITE_DEBUG=false
VITE_ANALYTICS_ID=your-analytics-id
```

---

## 🛠️ **How to Set Environment Variables**

### **Render (Backend)**

#### Method 1: Render Dashboard
1. Go to your service dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable with its value
5. Click **"Save Changes"**

#### Method 2: render.yaml (Recommended)
```yaml
services:
  - type: web
    name: echoprompt-backend
    env: node
    plan: free
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
```

### **Netlify (Frontend)**

#### Method 1: Netlify Dashboard
1. Go to your site dashboard
2. Click **"Site settings"**
3. Click **"Environment variables"**
4. Click **"Add variable"**
5. Add each variable with its value
6. Click **"Save"**

#### Method 2: netlify.toml
```toml
[context.production.environment]
  VITE_API_URL = "https://echoprompt-backend.onrender.com"
  VITE_APP_NAME = "EchoPrompt"
  VITE_DEBUG = "false"
```

### **Vercel (Frontend)**

#### Method 1: Vercel Dashboard
1. Go to your project dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Add each variable with its value
5. Click **"Save"**

#### Method 2: vercel.json
```json
{
  "env": {
    "VITE_API_URL": "https://echoprompt-backend.onrender.com",
    "VITE_APP_NAME": "EchoPrompt"
  }
}
```

---

## 🔑 **Variable Descriptions**

### **Backend Variables**

#### `NODE_ENV`
- **Purpose**: Sets the application environment
- **Value**: `production`
- **Required**: Yes
- **Example**: `NODE_ENV=production`

#### `PORT`
- **Purpose**: Port number for the server
- **Value**: `10000` (Render's default)
- **Required**: Yes
- **Example**: `PORT=10000`

#### `MONGODB_URI`
- **Purpose**: MongoDB connection string
- **Value**: Your Atlas connection string
- **Required**: Yes
- **Example**: `mongodb+srv://user:pass@cluster.mongodb.net/echoprompt`

#### `JWT_SECRET`
- **Purpose**: Secret key for JWT token signing
- **Value**: Random string (32+ characters)
- **Required**: Yes
- **Example**: `JWT_SECRET=your-super-secret-jwt-key-here`

#### `GEMINI_API_KEY`
- **Purpose**: Google Gemini AI API key
- **Value**: Your Gemini API key
- **Required**: No (app works without it)
- **Example**: `GEMINI_API_KEY=AIzaSy...`

### **Frontend Variables**

#### `VITE_API_URL`
- **Purpose**: Backend API base URL
- **Value**: Your Render backend URL
- **Required**: Yes
- **Example**: `VITE_API_URL=https://echoprompt-backend.onrender.com`

#### `VITE_APP_NAME`
- **Purpose**: Application name
- **Value**: Display name for the app
- **Required**: No
- **Example**: `VITE_APP_NAME=EchoPrompt`

---

## 🔒 **Security Best Practices**

### **Never Commit These Files:**
```
.env
.env.local
.env.production
.env.development
```

### **Use Strong Secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate random password
openssl rand -base64 16
```

### **Environment-Specific Variables:**
```bash
# Development
NODE_ENV=development
VITE_API_URL=http://localhost:3001

# Production
NODE_ENV=production
VITE_API_URL=https://echoprompt-backend.onrender.com
```

---

## 🧪 **Testing Environment Variables**

### **Backend Test:**
```bash
# Test MongoDB connection
cd backend
node -e "console.log('MongoDB URI:', process.env.MONGODB_URI)"

# Test all variables
node -e "console.log('NODE_ENV:', process.env.NODE_ENV); console.log('PORT:', process.env.PORT);"
```

### **Frontend Test:**
```bash
# Test API URL
echo $VITE_API_URL

# Test in browser console
console.log(import.meta.env.VITE_API_URL)
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Variables Not Loading**
**Problem**: Environment variables not available in code
**Solution**: 
- Check variable names are exact
- Ensure variables are set in correct environment
- Redeploy after adding variables

### **Issue 2: CORS Errors**
**Problem**: Frontend can't connect to backend
**Solution**:
- Check `VITE_API_URL` is correct
- Update CORS settings in backend
- Verify backend is running

### **Issue 3: Database Connection Failed**
**Problem**: Backend can't connect to MongoDB
**Solution**:
- Check `MONGODB_URI` format
- Verify Atlas cluster is running
- Check network access settings

### **Issue 4: Build Failures**
**Problem**: Build fails due to missing variables
**Solution**:
- Add all required variables
- Check variable syntax
- Verify build environment

---

## 📋 **Deployment Checklist**

### **Before Deployment:**
- [ ] All environment variables documented
- [ ] Secrets are strong and unique
- [ ] No sensitive data in code
- [ ] Variables tested locally

### **After Deployment:**
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] API calls work
- [ ] Database connection established
- [ ] All features functional

---

## 💡 **Pro Tips**

1. **Use Different Secrets**: Don't reuse secrets across environments
2. **Rotate Secrets**: Regularly update JWT secrets and passwords
3. **Monitor Usage**: Keep track of API key usage
4. **Backup Variables**: Keep a secure backup of all variables
5. **Document Everything**: Keep a record of all variables and their purposes
