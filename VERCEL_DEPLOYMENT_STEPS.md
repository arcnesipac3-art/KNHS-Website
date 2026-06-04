# 🚀 Vercel Deployment - Step by Step Guide

Quick guide to deploy your KNHS Portal frontend to Vercel.

---

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/arcnesipac3-art/KNHS-Website
- ✅ Vercel account (free): https://vercel.com
- ✅ Files ready: `vercel.json` and `.env.production` created

---

## 🎯 Step-by-Step Instructions

### **Step 1: Go to Vercel**

1. Open your browser and go to: **https://vercel.com**
2. Click **"Sign Up"** (or **"Login"** if you have an account)
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

### **Step 2: Import Your Project**

1. After logging in, you'll see the Vercel dashboard
2. Click the **"Add New..."** button (top right)
3. Select **"Project"** from dropdown
4. You'll see **"Import Git Repository"** page

---

### **Step 3: Connect Your Repository**

1. Find **"arcnesipac3-art/KNHS-Website"** in the list
   - If you don't see it, click **"Adjust GitHub App Permissions"** and grant access
2. Click **"Import"** button next to your repository

---

### **Step 4: Configure Project Settings**

Vercel will auto-detect some settings. Configure them as follows:

#### **Project Settings:**
```
Project Name: knhs-portal
Framework Preset: Vite
```

#### **Build & Development Settings:**
```
Root Directory: frontend           ← Click "Edit" and type "frontend"
Build Command: npm run build       ← Should auto-detect
Output Directory: dist             ← Should auto-detect
Install Command: npm install       ← Should auto-detect
```

#### **Environment Variables:**
Click **"Add Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `http://localhost:8000` |

**Note:** We'll update this after deploying the backend to Render

---

### **Step 5: Deploy!**

1. Review all settings
2. Click the big **"Deploy"** button
3. Wait 2-3 minutes while Vercel:
   - ✅ Clones your repository
   - ✅ Installs dependencies (`npm install`)
   - ✅ Builds your React app (`npm run build`)
   - ✅ Deploys to CDN

You'll see a progress screen with build logs.

---

### **Step 6: View Your Live Site**

1. Once deployment completes, you'll see: 🎉 **"Congratulations!"**
2. Click **"Visit"** or the preview image
3. Your site is now live at: `https://knhs-portal.vercel.app` (or similar)
4. **Copy this URL** - you'll need it for backend CORS configuration

---

## ✅ Post-Deployment Checklist

### **Immediate Actions:**

- [ ] Copy your Vercel URL (e.g., `https://knhs-portal.vercel.app`)
- [ ] Test the homepage - it should load
- [ ] Login won't work yet (backend not deployed)

### **After Backend Deployment (Next):**

1. Go to Vercel dashboard → Your Project → **Settings** → **Environment Variables**
2. Edit `VITE_API_BASE_URL`:
   - Change from: `http://localhost:8000`
   - Change to: `https://your-backend.onrender.com` (your Render URL)
3. Click **"Save"**
4. Go to **Deployments** tab → Click **"Redeploy"** on latest deployment
5. Test login functionality

---

## 🔧 Vercel Dashboard Overview

After deployment, you can access:

### **Key Sections:**

1. **Deployments** - View all deployments, logs, and redeploy
2. **Settings** - Configure environment variables, domains
3. **Analytics** - View traffic (if enabled)
4. **Domains** - Add custom domain (optional)

### **Useful Features:**

- **Automatic Deployments:** Every push to `main` branch auto-deploys
- **Preview Deployments:** Pull requests get preview URLs
- **Instant Rollback:** Revert to previous deployment in 1 click
- **Edge Network:** Your site is distributed globally for fast loading

---

## 🌐 Custom Domain (Optional)

If you want `portal.knhs.edu.ph` instead of `knhs-portal.vercel.app`:

1. Go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `portal.knhs.edu.ph`
4. Follow DNS setup instructions from Vercel
5. Add CNAME record at your domain registrar:
   ```
   Type: CNAME
   Name: portal
   Value: cname.vercel-dns.com
   ```
6. Wait 10-30 minutes for SSL certificate

---

## 🐛 Troubleshooting

### **Issue: Build Failed**

**Check build logs in Vercel dashboard:**

1. Click on failed deployment
2. View **"Building"** section logs
3. Common fixes:
   - Missing dependencies: Check `package.json`
   - Syntax errors: Fix code and push again
   - Node version: Add `.nvmrc` file with `18` or `20`

### **Issue: Page Shows 404**

**Fix:** Ensure `vercel.json` is in `/frontend` directory (already created)

### **Issue: Environment Variable Not Working**

1. Go to Settings → Environment Variables
2. Verify variable name starts with `VITE_`
3. Click **"Redeploy"** after changes

### **Issue: Can't Connect to Backend**

**Wait until backend is deployed, then:**
1. Update `VITE_API_BASE_URL` environment variable
2. Redeploy frontend
3. Check browser console for CORS errors

---

## 📱 Testing Your Deployed Frontend

### **What Works Now:**
- ✅ Homepage loads
- ✅ Navigation works
- ✅ Static content displays
- ✅ Routing between pages

### **What Doesn't Work Yet:**
- ❌ Login (no backend)
- ❌ API calls (no backend)
- ❌ Dashboard (requires authentication)

### **Test Checklist:**
1. Open your Vercel URL
2. Click through navigation links
3. Try accessing `/login` page
4. Check browser console for errors (F12)
5. Test on mobile device

---

## 🔄 Making Updates

**Automatic Deployment (Recommended):**
1. Make changes to your code locally
2. Commit: `git add . && git commit -m "Update message"`
3. Push: `git push origin main`
4. Vercel automatically deploys (takes ~2 minutes)

**Manual Deployment:**
1. Go to Vercel dashboard → **Deployments**
2. Click **"Redeploy"** on any previous deployment
3. Confirm

---

## 📊 Your Deployment URLs

After completing deployment, fill these in:

```
Frontend URL: https://_________________.vercel.app
Backend URL: https://_________________.onrender.com (deploy next)
Database: (Supabase - setup before backend)
```

---

## ⏭️ Next Steps

After Vercel deployment is complete:

1. ✅ **Supabase Setup** (Database) - Set up PostgreSQL database
2. ✅ **Render Setup** (Backend) - Deploy Django API
3. ✅ **Connect Services** - Update environment variables
4. ✅ **Test Full Stack** - Login and test features

📖 **Follow:** `DEPLOYMENT_GUIDE.md` for complete deployment process

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Build Logs:** Check in Vercel dashboard under Deployments
- **Community:** https://github.com/vercel/vercel/discussions

---

## ✨ Quick Reference Commands

```bash
# Test build locally before deploying
cd frontend
npm install
npm run build
npm run preview    # Preview production build

# Check for errors
npm run lint

# Install Vercel CLI (optional)
npm i -g vercel
vercel login
vercel --prod
```

---

**Your frontend is ready to deploy! Follow the steps above and you'll be live in minutes! 🚀**
