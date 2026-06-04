# 🚀 Deployment Guide: Supabase + Vercel + Render

Complete deployment guide for KNHS Portal: PostgreSQL database on Supabase, React frontend on Vercel, and Django backend on Render.

---

## 📋 Overview

| Service | Purpose | Hosting |
|---------|---------|---------|
| **Supabase** | PostgreSQL database + file storage | [supabase.com](https://supabase.com) |
| **Vercel** | React frontend (static) | [vercel.com](https://vercel.com) |
| **Render** | Django backend (API) | [render.com](https://render.com) |

**Architecture Flow:**
```
User Browser → Vercel (Frontend) → Render (API) → Supabase (Database)
                                                  ↓
                                           Supabase Storage (Files)
```

---

## 1️⃣ Supabase Setup (Database)

### Step 1: Create Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name:** `knhs-portal`
   - **Database Password:** Generate strong password (save this!)
   - **Region:** Singapore (closest to Philippines)
   - **Pricing Plan:** Free tier (upgradeable later)
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Database Credentials

1. In project dashboard, go to **Settings** → **Database**
2. Copy these values (you'll need them for backend):
   ```
   Host: db.xxxxxxxxxxxxx.supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [your database password]
   ```
3. **Connection String (Direct):**
   ```
   postgresql://postgres:[password]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### Step 3: Enable File Storage (Optional)

1. Go to **Storage** in sidebar
2. Click **"Create bucket"**
3. Create buckets:
   - `assignments` (Private)
   - `materials` (Public)
   - `avatars` (Public)
   - `documents` (Private - for enrollment docs)
4. Note your **Storage URL** (Settings → API):
   ```
   https://xxxxxxxxxxxxx.supabase.co/storage/v1
   ```

### Step 4: Configure Connection Pooling (Recommended)

1. Go to **Settings** → **Database** → **Connection Pooling**
2. Copy **Transaction pooling** connection string:
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
3. Use this for production (handles more concurrent connections)

---

## 2️⃣ Render Setup (Backend)

### Step 1: Prepare Backend for Production

1. **Create `backend/requirements.txt`** (if not exists):
   ```txt
   Django==4.2.7
   djangorestframework==3.14.0
   djangorestframework-simplejwt==5.3.0
   django-cors-headers==4.3.0
   psycopg2-binary==2.9.9
   gunicorn==21.2.0
   whitenoise==6.6.0
   python-dotenv==1.0.0
   Pillow==10.1.0
   ```

2. **Create `backend/render.yaml`** (optional - for auto-deploy):
   ```yaml
   services:
     - type: web
       name: knhs-backend
       runtime: python
       buildCommand: pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
       startCommand: gunicorn config.wsgi:application
       envVars:
         - key: DJANGO_SETTINGS_MODULE
           value: config.settings
         - key: PYTHON_VERSION
           value: 3.11.0
   ```

3. **Update `backend/config/settings.py`**:
   ```python
   import os
   import dj_database_url
   from pathlib import Path
   
   # Add these imports
   from dotenv import load_dotenv
   load_dotenv()
   
   # SECURITY WARNING: don't run with debug turned on in production!
   DEBUG = os.environ.get('DEBUG', 'False') == 'True'
   
   ALLOWED_HOSTS = [
       'localhost',
       '127.0.0.1',
       '.onrender.com',  # Render domains
       os.environ.get('ALLOWED_HOST', ''),
   ]
   
   # Database
   if os.environ.get('DATABASE_URL'):
       # Production: Use Supabase PostgreSQL
       DATABASES = {
           'default': dj_database_url.config(
               default=os.environ.get('DATABASE_URL'),
               conn_max_age=600,
               conn_health_checks=True,
           )
       }
   else:
       # Development: SQLite
       DATABASES = {
           'default': {
               'ENGINE': 'django.db.backends.sqlite3',
               'NAME': BASE_DIR / 'db.sqlite3',
           }
       }
   
   # Static files (CSS, JavaScript, Images)
   STATIC_URL = '/static/'
   STATIC_ROOT = BASE_DIR / 'staticfiles'
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   
   # CORS - Update with Vercel domain
   CORS_ALLOWED_ORIGINS = [
       'http://localhost:5173',  # Vite dev
       'http://localhost:3000',  # Alternative
       os.environ.get('FRONTEND_URL', ''),  # Vercel URL
   ]
   CORS_ALLOW_CREDENTIALS = True
   
   # CSRF Trusted Origins
   CSRF_TRUSTED_ORIGINS = [
       'http://localhost:5173',
       os.environ.get('FRONTEND_URL', ''),
   ]
   
   # Security settings for production
   if not DEBUG:
       SECURE_SSL_REDIRECT = True
       SESSION_COOKIE_SECURE = True
       CSRF_COOKIE_SECURE = True
       SECURE_BROWSER_XSS_FILTER = True
       SECURE_CONTENT_TYPE_NOSNIFF = True
       X_FRAME_OPTIONS = 'DENY'
   ```

### Step 2: Create Render Service

1. Go to [https://render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `knhs-backend`
   - **Region:** Singapore (closest to Philippines)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
     ```
   - **Start Command:**
     ```bash
     gunicorn config.wsgi:application
     ```
   - **Instance Type:** Free (or Starter for better performance)

### Step 3: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
SECRET_KEY=your-super-secret-key-here-generate-new-one
DEBUG=False
DATABASE_URL=postgresql://postgres:[password]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
ALLOWED_HOST=knhs-backend.onrender.com
FRONTEND_URL=https://your-app.vercel.app
```

**Generate SECRET_KEY:**
```python
# Run in Python
import secrets
print(secrets.token_urlsafe(50))
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (~3-5 minutes)
3. Your backend will be at: `https://knhs-backend.onrender.com`
4. Test health check: `https://knhs-backend.onrender.com/api/v1/health/`

### Step 5: Run Initial Setup (One-time)

1. Go to Render dashboard → **Shell** tab
2. Run seed commands:
   ```bash
   python manage.py seed_admin
   python manage.py seed_academic_data
   ```

---

## 3️⃣ Vercel Setup (Frontend)

### Step 1: Prepare Frontend for Production

1. **Update `frontend/.env.production`**:
   ```env
   VITE_API_BASE_URL=https://knhs-backend.onrender.com
   ```

2. **Update `frontend/vite.config.js`** (if needed):
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   
   export default defineConfig({
     plugins: [react()],
     server: {
       port: 5173,
     },
     build: {
       outDir: 'dist',
       sourcemap: false,
     },
   })
   ```

3. **Create `frontend/vercel.json`** (for SPA routing):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Step 3: Add Environment Variables

In Vercel project settings → **Environment Variables**:

```
VITE_API_BASE_URL=https://knhs-backend.onrender.com
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build (~2-3 minutes)
3. Your frontend will be at: `https://your-app.vercel.app`

### Step 5: Update Backend CORS

Go back to Render → Environment Variables → Update:
```
FRONTEND_URL=https://your-app.vercel.app
```

Then redeploy backend (Render → Manual Deploy)

---

## 4️⃣ Connect Everything

### Update API Client (Frontend)

**`frontend/src/lib/api.js`:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Test Full Stack

1. **Backend Health:**
   ```
   https://knhs-backend.onrender.com/api/v1/health/
   ```

2. **Frontend Login:**
   - Go to `https://your-app.vercel.app/login`
   - Try logging in with admin credentials
   - Check browser console for CORS errors

3. **Database Connection:**
   - Render Shell: `python manage.py dbshell`
   - Query: `SELECT COUNT(*) FROM accounts_user;`

---

## 5️⃣ Custom Domain (Optional)

### For Vercel (Frontend)

1. In Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `portal.knhs.edu.ph`)
3. Update DNS records at your domain provider:
   - **Type:** CNAME
   - **Name:** `portal` (or `@` for root)
   - **Value:** `cname.vercel-dns.com`
4. Wait for SSL certificate (~10 minutes)

### For Render (Backend)

1. In Render service → **Settings** → **Custom Domain**
2. Add `api.knhs.edu.ph`
3. Update DNS:
   - **Type:** CNAME
   - **Name:** `api`
   - **Value:** Your Render domain

---

## 6️⃣ File Upload Configuration

### Option A: Supabase Storage (Recommended)

**Install Supabase client:**
```bash
cd backend
pip install supabase
```

**Backend settings:**
```python
# backend/config/settings.py
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')

# Use for file uploads instead of local storage
```

**Get credentials from Supabase:**
- Settings → API → Project URL
- Settings → API → anon/public key

### Option B: Render Disk Storage (Limited)

Render free tier has ephemeral storage (resets on deploy). For persistent files:
- Upgrade to paid plan with persistent disk
- Or use Supabase Storage
- Or use Cloudinary/AWS S3

---

## 7️⃣ Monitoring & Maintenance

### Render Monitoring

1. **Logs:** Render dashboard → Logs tab
2. **Metrics:** CPU, Memory, Response times
3. **Alerts:** Settings → Notifications

### Database Monitoring

1. Supabase dashboard → **Database** → **Query Performance**
2. Enable **Log Explorer** for query analysis
3. Check **Disk Usage** (free tier: 500MB)

### Vercel Analytics

1. Vercel project → **Analytics** tab
2. View page views, load times, errors
3. Enable **Web Vitals** monitoring

---

## 8️⃣ Backup Strategy

### Database Backups (Supabase)

1. Go to **Database** → **Backups**
2. Free tier: 7 daily backups (automatic)
3. Paid tier: Point-in-time recovery
4. Manual backup: Use `pg_dump`:
   ```bash
   pg_dump "postgresql://postgres:[password]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres" > backup.sql
   ```

### Code Backups

- Already on GitHub
- Vercel auto-deploys from Git
- Render auto-deploys from Git

---

## 9️⃣ Troubleshooting

### Issue: CORS Errors

**Symptom:** Frontend can't connect to backend

**Fix:**
1. Check backend logs in Render
2. Verify `CORS_ALLOWED_ORIGINS` includes Vercel URL
3. Verify `FRONTEND_URL` environment variable
4. Redeploy backend after changes

### Issue: Database Connection Errors

**Symptom:** `could not connect to server`

**Fix:**
1. Verify `DATABASE_URL` in Render environment variables
2. Check Supabase project status
3. Test connection from Render Shell:
   ```bash
   python manage.py dbshell
   ```

### Issue: Static Files Not Loading

**Symptom:** CSS/images broken in production

**Fix:**
1. Verify `STATIC_ROOT` in settings
2. Run collectstatic in build command
3. Check Whitenoise configuration

### Issue: Render Service Sleeping (Free Tier)

**Symptom:** First request takes 30+ seconds

**Fix:**
- Free tier spins down after inactivity
- Upgrade to paid plan for always-on
- Or use cron job to ping every 10 minutes

---

## 🔟 Cost Summary

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| **Supabase** | 500MB database, 1GB storage | $25/mo (8GB database, 100GB storage) |
| **Vercel** | 100GB bandwidth | $20/mo Pro (1TB bandwidth) |
| **Render** | 750 hrs/mo, sleeps after 15min | $7/mo (always-on) |
| **Total Free** | $0/mo | Good for testing |
| **Total Paid** | ~$52/mo | Production-ready |

---

## 📚 Next Steps

After deployment:

1. ✅ Test all endpoints with production URLs
2. ✅ Create real admin account (not seed data)
3. ✅ Set up monitoring alerts
4. ✅ Configure backup schedule
5. ✅ Update README with production URLs
6. ✅ Train staff on production system
7. ✅ Plan database migration from dev data
8. ✅ Set up custom domains
9. ✅ Enable SSL/HTTPS (auto on Vercel/Render)
10. ✅ Document deployment process for team

---

## 🆘 Support Links

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Django Deployment:** https://docs.djangoproject.com/en/4.2/howto/deployment/
- **Vite Production:** https://vitejs.dev/guide/build.html

---

**Deployment Checklist:**

- [ ] Supabase project created
- [ ] Database credentials saved securely
- [ ] Render backend deployed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Admin account created
- [ ] Vercel frontend deployed
- [ ] CORS configured correctly
- [ ] Full stack tested end-to-end
- [ ] Custom domains configured (optional)
- [ ] Monitoring enabled
- [ ] Backup strategy documented

---

**Built for KNHS with ❤️**
