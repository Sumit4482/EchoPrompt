# 🌐 Netlify Setup Guide

## What You Need for Netlify

### 1. **Account Setup**
- Go to [netlify.com](https://netlify.com)
- Click **"Sign up"**
- Choose **"Sign up with GitHub"** (recommended)
- Authorize Netlify to access your repositories

### 2. **Repository Requirements**
- Your code must be on GitHub
- Repository can be public or private
- Main branch should have your latest code
- Must have `netlify.toml` configuration file

### 3. **Frontend Deployment on Netlify**

#### Step 1: Create New Site
1. Click **"New site from Git"**
2. Choose **"GitHub"** as provider
3. **Select** your repository: `emini-prompt-guide`
4. Click **"Deploy site"**

#### Step 2: Configure Build Settings
Netlify will auto-detect Vite, but verify these settings:

```
Build command: npm run build
Publish directory: dist
Base directory: (leave empty)
```

#### Step 3: Environment Variables
Go to **Site settings** → **Environment variables** and add:

```bash
VITE_API_URL=https://echoprompt-backend.onrender.com
```

#### Step 4: Deploy
- Click **"Deploy site"**
- Wait for build to complete (2-5 minutes)
- Your site will be available at: `https://random-name-123456.netlify.app`

### 4. **Custom Domain Setup**

#### Step 1: Add Custom Domain
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `echoprompt.com`)
4. Click **"Verify"**

#### Step 2: Configure DNS
Update your DNS records:
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app

Type: A
Name: @
Value: 75.2.60.5
```

#### Step 3: SSL Certificate
- Netlify automatically provisions SSL certificates
- Wait 5-10 minutes for certificate to be issued
- Your site will be available at `https://yourdomain.com`

### 5. **Netlify Configuration File**

The `netlify.toml` file I created handles:
- Build settings
- Redirect rules for SPA
- API proxy to backend
- Environment variables

### 6. **Netlify Free Tier Limits**

#### What's Included:
- ✅ 100GB bandwidth per month
- ✅ 300 build minutes per month
- ✅ Unlimited sites
- ✅ Automatic SSL certificates
- ✅ Form handling (100 submissions/month)
- ✅ Edge functions (125,000 requests/month)
- ✅ Branch previews
- ✅ Custom domains

#### What's Not Included:
- ❌ Advanced analytics
- ❌ Priority support
- ❌ Advanced security features
- ❌ Team management

### 7. **Advanced Features**

#### Form Handling:
```html
<!-- Add to your contact form -->
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  <!-- Your form fields -->
</form>
```

#### Edge Functions:
Create `netlify/functions/hello.js`:
```javascript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Netlify!' })
  };
};
```

#### Redirects and Rewrites:
```toml
# In netlify.toml
[[redirects]]
  from = "/api/*"
  to = "https://echoprompt-backend.onrender.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 8. **Continuous Deployment**

#### Automatic Deployments:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from pull requests
- **Branch**: Deploy any branch as preview

#### Deploy Hooks:
1. Go to **Site settings** → **Build & deploy** → **Deploy hooks**
2. Click **"Add deploy hook"**
3. Copy the webhook URL
4. Use in GitHub Actions or other CI/CD

### 9. **Performance Optimization**

#### Build Optimization:
```toml
# In netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"
```

#### Caching Headers:
```toml
# In netlify.toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

#### Image Optimization:
- Use Netlify's built-in image optimization
- Implement lazy loading
- Use WebP format when possible

### 10. **Troubleshooting**

#### Common Issues:

**1. Build Fails**
- Check build logs in Netlify dashboard
- Verify Node.js version
- Check for missing dependencies
- Ensure build command is correct

**2. Environment Variables Not Working**
- Variables must start with `VITE_` for Vite
- Check variable names are exact
- Redeploy after adding variables

**3. API Calls Fail**
- Check CORS settings in backend
- Verify API URL is correct
- Check if backend is running

**4. Custom Domain Not Working**
- Check DNS propagation (can take 24-48 hours)
- Verify DNS records are correct
- Check SSL certificate status

#### Debug Commands:
```bash
# Test build locally
npm run build

# Test production build
npm run preview

# Check environment variables
echo $VITE_API_URL
```

### 11. **Monitoring & Analytics**

#### Netlify Analytics:
- Basic analytics included in free tier
- Page views, unique visitors
- Top pages and referrers
- Build and deploy history

#### External Analytics:
- Google Analytics
- Plausible
- Fathom
- Mixpanel

### 12. **Security Features**

#### Security Headers:
```toml
# In netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### Access Control:
- Password protect specific pages
- IP whitelisting
- Country blocking
- Bot protection

---

## 🎯 Quick Start Checklist

- [ ] Sign up at netlify.com
- [ ] Connect GitHub account
- [ ] Create new site from Git
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy site
- [ ] Test site functionality
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate

---

## 📞 Support
- **Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Community**: [community.netlify.com](https://community.netlify.com)
- **Status**: [status.netlify.com](https://status.netlify.com)

---

## 💡 Pro Tips

1. **Use Branch Previews**: Test changes before merging to main
2. **Optimize Images**: Use Netlify's image optimization
3. **Monitor Build Times**: Keep builds under 300 minutes/month
4. **Use Edge Functions**: For serverless functions
5. **Set Up Alerts**: Get notified of build failures
6. **Use Deploy Hooks**: For advanced CI/CD workflows
