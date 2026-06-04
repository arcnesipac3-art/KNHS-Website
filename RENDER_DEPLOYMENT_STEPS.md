# 🚀 Render Deployment - Step by Step Guide

Complete guide to deploy your KNHS Portal backend (Django) to Render.

---

## 📋 Prerequisites

- ✅ GitHub repository: https://github.com/arcnesipac3-art/KNHS-Website
- ✅ Supabase database ready (with DATABASE_URL)
- ✅ Vercel frontend deployed (with URL)
- ✅ Render account (free): https://render.com

---

## 🎯 Step-by-Step Instructions

### **Step 1: Create Supabase Database First**

**Before deploying to Render, you need a PostgreSQL database from Supabase:**

1. Go to **https://supabase.com** and login
2. Click **"New Project"**
3. Fill in:
   - **Name:** `knhs-portal`
   - **Database Password:** Generate strong password (SAVE THIS!)
   - **Region:** Singapore
4. Wait 2 minutes for project creation
5. Go to **Settings** → **Database**
6. Copy your **Connection String (URI)**:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
7. **SAVE THIS URL** - you'll need it for Render!

---

### **Step 2: Go to Render**

1. Open: **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Render to access your repositories

---

### **Step 3: Create New Web Service**

1. In Render Dashboard, click **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll see "Create a new Web Service" page

---

### **Step 4: Connect Repository**

1. Find **"arcnesipac3-art/KNHS-Website"** in the list
   - If not visible, click **"Configure account"** to grant access
2. Click **"Connect"** button next to your repository

---

### **Step 5: Configure Web Service**

Fill in these settings **EXACTLY**:

#### **Basic Settings:**
```
Name: knhs-backend
Region: Singapore
Branch: main
Root Directory: backend          ← IMPORTANT: Click "Edit" and type this!
```

#### **Runtime:**
```
Runtime: Python 3
```

#### **Build & Start Commands:**
```
Build Command: ./build.sh
Start Command: gunicorn config.wsgi:application
```

**Note:** The `build.sh` script handles:
- Installing dependencies
- Running migrations
- Collecting static files

#### **Instance Type:**
```
Instance Type: Free           (or Starter $7/mo for better performance)
```

---

### **Step 6: Add Environment Variables**

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** and add these **ONE BY ONE**:

#### **Required Variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | (generate new) | See below for generation |
| `DEBUG` | `False` | Production mode |
| `DATABASE_URL` | (your Supabase URL) | From Step 1 |
| `ALLOWED_HOSTS` | `knhs-backend.onrender.com` | Your Render domain |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Your Vercel URL |
| `CSRF_TRUSTED_ORIGINS` | `https://your-app.vercel.app` | Your Vercel URL |
| `RENDER` | `true` | Auto-detects Render |
| `PYTHON_VERSION` | `3.11.0` | Python version |

#### **How to Generate SECRET_KEY:**

**Option 1: Use Python (locally):**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

**Option 2: Use Online Generator:**
- Go to: https://djecrety.ir/
- Copy the generated key

**Example SECRET_KEY:**
```
k9_Xp2mN5vQ8wR1tY4uI7oP0aS3dF6gH9jK2lZ5xC8vB1nM4qW7eR0tY3
```

---

### **Step 7: Deploy!**

1. Review all settings carefully
2. Click **"Create Web Service"** button at bottom
3. Render will start building (takes 3-5 minutes)
4. You'll see build logs in real-time:
   - ✅ Installing dependencies
   - ✅ Running migrations
   - ✅ Collecting static files
   - ✅ Starting Gunicorn server

---

### **Step 8: Get Your Backend URL**

1. Once deploy succeeds, you'll see: **"Live"** status (green)
2. Your backend URL will be: `https://knhs-backend.onrender.com`
3. **Copy this URL** - you need it for frontend!

---

### **Step 9: Test Your Backend**

Open these URLs in browser:

1. **Health Check:**
   ```
   https://knhs-backend.onrender.com/api/v1/health/
   ```
   Should return: `{"status": "healthy"}`

2. **Admin Panel:**
   ```
   https://knhs-backend.onrender.com/admin/
   ```
   Should load Django admin login

---

### **Step 10: Seed Initial Data**

You need to create admin user and sample data:

1. In Render Dashboard → Your Service → Click **"Shell"** tab
2. Run these commands:

```bash
# Create admin user
python manage.py seed_admin

# Create sample academic data
python manage.py seed_academic_data

# (Optional) Create Sprint 3 sample data
python manage.py seed_sprint3_data
```

**Default Admin Credentials:**
- Email: `admin@knhs.edu.ph`
- Password: `admin123`

**⚠️ Change password after first login!**

---

## 🔗 Connect Frontend to Backend

Now update your Vercel frontend to use the backend:

### **Step 1: Update Vercel Environment Variable**

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Find `VITE_API_BASE_URL`
4. Click **Edit** and change to:
   ```
   https://knhs-backend.onrender.com
   ```
5. Click **Save**

### **Step 2: Redeploy Frontend**

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **"Redeploy"** button
4. Wait 2 minutes for rebuild

### **Step 3: Update Backend CORS**

Your backend needs to know about your Vercel URL:

1. Go to **Render Dashboard** → Your Service
2. Click **Environment** tab
3. Edit these variables:
   - `CORS_ALLOWED_ORIGINS`: `https://your-app.vercel.app`
   - `CSRF_TRUSTED_ORIGINS`: `https://your-app.vercel.app`
   - `ALLOWED_HOSTS`: `knhs-backend.onrender.com,your-app.vercel.app`
4. Click **Save Changes**
5. Service will auto-redeploy

---

## ✅ Test Full Stack

### **1. Test Login**

1. Go to your Vercel URL: `https://your-app.vercel.app`
2. Click **Login**
3. Enter:
   - Email: `admin@knhs.edu.ph`
   - Password: `admin123`
4. Should redirect to Admin Dashboard

### **2. Test API Calls**

Open browser console (F12) and check:
- No CORS errors
- API calls succeed
- JWT tokens received

### **3. Test Features**

- ✅ Dashboard loads
- ✅ Navigation works
- ✅ Can view classes
- ✅ Can create assignments
- ✅ Data persists in database

---

## 🔧 Render Dashboard Features

### **Tabs Overview:**

1. **Logs** - View application logs (errors, requests)
2. **Shell** - Access terminal for management commands
3. **Metrics** - CPU, memory, response times
4. **Environment** - Manage environment variables
5. **Settings** - Configure service settings

### **Useful Commands in Shell:**

```bash
# Check database connection
python manage.py dbshell

# Create superuser manually
python manage.py createsuperuser

# View migrations
python manage.py showmigrations

# Run custom management command
python manage.py <command_name>
```

---

## 🐛 Troubleshooting

### **Issue: Build Failed**

**Check Build Logs:**
1. Click on failed deployment
2. Look for error messages
3. Common fixes:
   - Missing dependencies in `requirements.txt`
   - Python version mismatch
   - Syntax errors in code

**Solution:**
- Fix the error locally
- Commit and push to GitHub
- Render auto-redeploys

---

### **Issue: Database Connection Error**

**Symptoms:**
- `could not connect to server`
- `connection refused`

**Solutions:**
1. Verify `DATABASE_URL` is correct in Environment Variables
2. Check Supabase project is running
3. Test connection from Render Shell:
   ```bash
   python manage.py dbshell
   ```

---

### **Issue: Static Files Not Loading**

**Symptoms:**
- Admin panel has no CSS
- 404 errors for `/static/` files

**Solutions:**
1. Check build logs - `collectstatic` should run
2. Verify Whitenoise is in `MIDDLEWARE`
3. Run manually in Shell:
   ```bash
   python manage.py collectstatic --no-input
   ```

---

### **Issue: CORS Errors**

**Symptoms:**
- Browser console: `blocked by CORS policy`
- Frontend can't connect to backend

**Solutions:**
1. Check `CORS_ALLOWED_ORIGINS` includes your Vercel URL
2. Check `CSRF_TRUSTED_ORIGINS` includes your Vercel URL
3. Ensure URLs use `https://` (not `http://`)
4. Redeploy after changing environment variables

---

### **Issue: Service Sleeping (Free Tier)**

**Symptoms:**
- First request takes 30+ seconds
- "Service unavailable" message

**Why:** Free tier spins down after 15 minutes of inactivity

**Solutions:**
- Wait 30-60 seconds for service to wake up
- Upgrade to Starter plan ($7/mo) for always-on
- Use a cron job to ping every 10 minutes

---

### **Issue: Migrations Not Running**

**Symptoms:**
- `no such table` errors
- Database schema mismatch

**Solutions:**
1. Check build logs for migration errors
2. Run manually in Shell:
   ```bash
   python manage.py migrate
   ```
3. If stuck, reset database (warning: deletes data):
   ```bash
   # Backup first!
   python manage.py flush
   python manage.py migrate
   ```

---

## 📊 Monitoring & Maintenance

### **View Logs**

1. Render Dashboard → **Logs** tab
2. Filter by:
   - Time range
   - Log level (INFO, WARNING, ERROR)
3. Download logs if needed

### **Check Performance**

1. **Metrics** tab shows:
   - CPU usage
   - Memory usage
   - Response times
   - Error rates

### **Set Up Alerts**

1. **Settings** → **Notifications**
2. Add email or Slack webhook
3. Get notified on:
   - Deploy failures
   - Service crashes
   - High resource usage

---

## 💰 Cost & Scaling

### **Free Tier:**
- ✅ 750 hours/month
- ✅ Spins down after 15 min inactivity
- ✅ 512 MB RAM
- ✅ Shared CPU
- ❌ Custom domains require paid plan

### **Starter Plan ($7/mo):**
- ✅ Always-on (no sleep)
- ✅ 512 MB RAM
- ✅ Custom domains
- ✅ More concurrent connections

### **Upgrade When:**
- Users complain about slow initial load
- Need custom domain
- Require 24/7 availability

---

## 🔐 Security Best Practices

### **1. Change Default Admin Password**
```bash
# In Render Shell
python manage.py changepassword admin@knhs.edu.ph
```

### **2. Rotate SECRET_KEY Periodically**
- Generate new key
- Update in Environment Variables
- All users need to re-login

### **3. Monitor Audit Logs**
- Check for suspicious activity
- Review failed login attempts

### **4. Enable 2FA (Future)**
- Implement for admin accounts
- Require for sensitive operations

---

## 🔄 Making Updates

### **Automatic Deployment:**
1. Make changes locally
2. Test locally: `python manage.py runserver`
3. Commit: `git add . && git commit -m "Update message"`
4. Push: `git push origin main`
5. Render auto-deploys (2-3 minutes)

### **Manual Deployment:**
1. Render Dashboard → **Manual Deploy**
2. Select branch
3. Click **"Deploy"**

### **Zero-Downtime Updates:**
- Render does rolling deployments
- Old version stays up until new version is ready
- Minimal disruption to users

---

## 📚 Important Files Created

| File | Purpose |
|------|---------|
| `backend/build.sh` | Build script for Render |
| `backend/render.yaml` | Render configuration |
| `backend/.env.example` | Environment variable template |
| `backend/requirements.txt` | Updated with production dependencies |
| `backend/config/settings.py` | Updated for production |

---

## 🆘 Support Resources

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Django Deployment:** https://docs.djangoproject.com/en/4.2/howto/deployment/
- **Supabase Docs:** https://supabase.com/docs

---

## ✅ Deployment Checklist

- [ ] Supabase database created
- [ ] DATABASE_URL saved
- [ ] Render service created
- [ ] All environment variables configured
- [ ] Build succeeded
- [ ] Service is "Live"
- [ ] Health check URL works
- [ ] Admin user seeded
- [ ] Sample data seeded
- [ ] Frontend updated with backend URL
- [ ] CORS configured correctly
- [ ] Full login flow tested
- [ ] Default password changed

---

## 🎉 You're Live!

Your backend is now deployed and production-ready!

**URLs:**
- Backend API: `https://knhs-backend.onrender.com`
- Admin Panel: `https://knhs-backend.onrender.com/admin/`
- Health Check: `https://knhs-backend.onrender.com/api/v1/health/`

**Next Steps:**
1. Train staff on the system
2. Import real student data
3. Configure school branding
4. Set up backups
5. Monitor usage and performance

---

**Built for KNHS with ❤️**
