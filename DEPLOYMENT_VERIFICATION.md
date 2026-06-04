# ✅ Deployment Verification Checklist

Complete checklist to verify your KNHS Portal deployment is working correctly.

---

## 🔗 Your Deployment URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend (Vercel)** | `https://your-app.vercel.app` | User interface |
| **Backend (Render)** | `https://knhs-website.onrender.com` | API server |
| **Database (Supabase)** | Dashboard at supabase.com | PostgreSQL database |

---

## 📋 Pre-Deployment Checklist

### ✅ Supabase (Database)
- [ ] Project created
- [ ] Database password saved securely
- [ ] Connection string copied
- [ ] Database is "Healthy" status in dashboard

### ✅ Render (Backend)
- [ ] Web service created
- [ ] Root directory set to `backend`
- [ ] Build command: `./build.sh`
- [ ] Start command: `gunicorn config.wsgi:application`
- [ ] All 8 environment variables added:
  - [ ] `SECRET_KEY`
  - [ ] `DEBUG` = `False`
  - [ ] `DATABASE_URL`
  - [ ] `ALLOWED_HOSTS`
  - [ ] `CORS_ALLOWED_ORIGINS`
  - [ ] `CSRF_TRUSTED_ORIGINS`
  - [ ] `RENDER` = `true`
  - [ ] `PYTHON_VERSION` = `3.11.0`
- [ ] Service status shows "Live" (green)
- [ ] Build logs show no errors

### ✅ Vercel (Frontend)
- [ ] Project deployed
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Environment variable `VITE_API_BASE_URL` set to Render URL
- [ ] Deployment status shows "Ready"
- [ ] No build errors

---

## 🧪 Backend Verification Tests

### Test 1: Health Check Endpoint

**URL to test:**
```
https://knhs-website.onrender.com/api/v1/health/
```

**Expected response:**
```json
{
  "status": "healthy"
}
```

**Status:** 
- [ ] ✅ Returns healthy status
- [ ] ❌ Returns error (see troubleshooting)

---

### Test 2: Admin Panel Access

**URL to test:**
```
https://knhs-website.onrender.com/admin/
```

**Expected result:**
- Django admin login page loads
- CSS styles are applied (not broken)
- Form fields visible

**Status:**
- [ ] ✅ Admin panel loads correctly
- [ ] ❌ 404 error
- [ ] ❌ CSS not loading (static files issue)

---

### Test 3: Admin Login

**Credentials:**
- Email: `admin@knhs.edu.ph`
- Password: `admin123`

**Steps:**
1. Go to admin panel
2. Enter credentials
3. Click "Log in"

**Expected result:**
- Successfully logs in
- Shows Django admin dashboard
- Can see "Accounts", "Academics", etc. sections

**Status:**
- [ ] ✅ Login successful
- [ ] ❌ Invalid credentials (seed data not run)
- [ ] ❌ Login error (check logs)

---

### Test 4: Database Connection

**Check in Render Shell:**
```bash
python manage.py dbshell
```

**Then run:**
```sql
SELECT COUNT(*) FROM accounts_user;
```

**Expected result:**
- Shows count of users (at least 1 if admin seeded)

**Status:**
- [ ] ✅ Database connected
- [ ] ❌ Connection error (check DATABASE_URL)

---

### Test 5: API Endpoints

**Test authentication endpoint:**
```bash
curl -X POST https://knhs-website.onrender.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@knhs.edu.ph","password":"admin123"}'
```

**Expected response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@knhs.edu.ph",
    "role": "admin",
    ...
  }
}
```

**Status:**
- [ ] ✅ Returns access token
- [ ] ❌ 404 error
- [ ] ❌ Authentication failed

---

## 🧪 Frontend Verification Tests

### Test 1: Homepage Loads

**URL:** Your Vercel URL

**Expected result:**
- Homepage displays
- DepEd header visible
- Navigation works
- No console errors (F12)

**Status:**
- [ ] ✅ Homepage loads
- [ ] ❌ Blank page
- [ ] ❌ Build error

---

### Test 2: Login Page Access

**URL:** `https://your-app.vercel.app/login`

**Expected result:**
- Login form displays
- Email and password fields visible
- "Login" button present

**Status:**
- [ ] ✅ Login page loads
- [ ] ❌ 404 error (routing issue)

---

### Test 3: Login Functionality

**Steps:**
1. Go to login page
2. Enter: `admin@knhs.edu.ph` / `admin123`
3. Click "Login"

**Expected result:**
- Redirects to dashboard
- Shows admin dashboard
- User info displayed (top right)

**Check browser console (F12):**
- [ ] No CORS errors
- [ ] No 401/403 errors
- [ ] API calls succeed

**Status:**
- [ ] ✅ Login successful, dashboard loads
- [ ] ❌ CORS error (check backend CORS settings)
- [ ] ❌ 401 error (authentication issue)
- [ ] ❌ Network error (backend down)

---

### Test 4: Navigation

**Test these routes:**
- [ ] `/` - Homepage
- [ ] `/about` - About page
- [ ] `/login` - Login page
- [ ] `/dashboard` - Dashboard (after login)

**Status:**
- [ ] ✅ All routes work
- [ ] ❌ Some routes 404 (check vercel.json)

---

### Test 5: API Connection

**Open browser console (F12) while logged in**

**Check Network tab:**
- Look for API calls to Render URL
- Should see: `https://knhs-website.onrender.com/api/v1/...`

**Expected:**
- [ ] ✅ API calls succeed (200 status)
- [ ] ❌ CORS errors
- [ ] ❌ 404 errors (backend not responding)

---

## 🔐 Security Verification

### Check 1: HTTPS Enabled
- [ ] ✅ Frontend uses `https://`
- [ ] ✅ Backend uses `https://`
- [ ] ✅ Browser shows padlock icon

### Check 2: Environment Variables Secure
- [ ] ✅ `DEBUG=False` in production
- [ ] ✅ `SECRET_KEY` is unique (not default)
- [ ] ✅ Database password not exposed in code

### Check 3: CORS Configured
- [ ] ✅ Only Vercel URL allowed in CORS
- [ ] ✅ Credentials allowed
- [ ] ❌ Wildcard (*) not used

---

## 📊 Data Verification

### Check 1: Admin User Exists

**In Render Shell:**
```bash
python manage.py shell
```

```python
from apps.accounts.models import User
User.objects.filter(role='admin').exists()
# Should return: True
```

**Status:**
- [ ] ✅ Admin user exists
- [ ] ❌ No admin user (run seed_admin)

---

### Check 2: Sample Data Loaded

**Check in admin panel:**
- [ ] Academic Years exist
- [ ] Quarters exist
- [ ] Subjects exist
- [ ] Classrooms exist

**Or in Shell:**
```bash
python manage.py shell
```

```python
from apps.academics.models import AcademicYear, Classroom
print(f"Academic Years: {AcademicYear.objects.count()}")
print(f"Classrooms: {Classroom.objects.count()}")
```

**Status:**
- [ ] ✅ Sample data exists
- [ ] ❌ No data (run seed_academic_data)

---

## 🐛 Common Issues & Fixes

### Issue: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:**
1. Verify `CORS_ALLOWED_ORIGINS` in Render includes your Vercel URL
2. Verify `CSRF_TRUSTED_ORIGINS` includes your Vercel URL
3. Ensure URLs use `https://` (not `http://`)
4. Redeploy backend after changes

**Render Environment Variables:**
```
CORS_ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-actual-vercel-url.vercel.app
```

---

### Issue: Backend Not Responding

**Symptoms:**
- Frontend shows "Network Error"
- API calls timeout

**Fix:**
1. Check Render service is "Live" (not sleeping)
2. Free tier sleeps after 15 min - wait 30 sec for wake up
3. Check Render logs for errors
4. Verify `VITE_API_BASE_URL` in Vercel matches Render URL

---

### Issue: Login Fails

**Symptoms:**
- "Invalid credentials" error
- 401 Unauthorized

**Fix:**
1. Verify admin user created: Run `seed_admin` in Render Shell
2. Check credentials: `admin@knhs.edu.ph` / `admin123`
3. Check backend logs in Render
4. Verify DATABASE_URL is correct

---

### Issue: Static Files Not Loading

**Symptoms:**
- Admin panel has no CSS
- Broken styling

**Fix:**
1. Check build logs - `collectstatic` should run
2. Verify Whitenoise in MIDDLEWARE
3. Run manually in Shell:
   ```bash
   python manage.py collectstatic --no-input
   ```

---

### Issue: Database Connection Error

**Symptoms:**
```
could not connect to server
```

**Fix:**
1. Verify `DATABASE_URL` is correct in Render
2. Check Supabase project is active
3. Test connection from Render Shell:
   ```bash
   python manage.py dbshell
   ```

---

## 🎯 Full Stack Integration Test

### Complete Login Flow

**Steps:**
1. Open frontend URL
2. Click "Login" in navigation
3. Enter credentials
4. Click "Login" button
5. Should redirect to dashboard
6. Dashboard shows user info
7. Try navigating to "My Classes"
8. Data loads from backend

**Checklist:**
- [ ] Step 1: ✅ Frontend loads
- [ ] Step 2: ✅ Login page accessible
- [ ] Step 3: ✅ Form accepts input
- [ ] Step 4: ✅ Form submits
- [ ] Step 5: ✅ Redirect works
- [ ] Step 6: ✅ Dashboard displays
- [ ] Step 7: ✅ Navigation works
- [ ] Step 8: ✅ API data loads

**Result:**
- [ ] ✅ **FULL STACK WORKING!** 🎉
- [ ] ❌ Issue at step: ___ (see fixes above)

---

## 📱 Mobile Testing

### Test on Mobile Device

**Steps:**
1. Open Vercel URL on mobile browser
2. Test login
3. Test navigation
4. Check responsive design

**Checklist:**
- [ ] Layout is mobile-friendly
- [ ] Touch interactions work
- [ ] No horizontal scrolling
- [ ] Text is readable

---

## 🔄 Post-Deployment Tasks

### Immediate Actions
- [ ] Change admin password from default
- [ ] Configure school branding in admin panel
- [ ] Create real teacher/student accounts
- [ ] Set up current academic year

### Security
- [ ] Review audit logs regularly
- [ ] Set up backup schedule
- [ ] Document deployment process
- [ ] Share credentials securely with ICT team

### Monitoring
- [ ] Bookmark Render dashboard
- [ ] Bookmark Vercel dashboard
- [ ] Bookmark Supabase dashboard
- [ ] Enable email notifications for errors

---

## 📞 Support Contacts

**If issues persist:**

1. **Check Logs:**
   - Render: Dashboard → Logs tab
   - Vercel: Dashboard → Deployments → View logs
   - Browser: F12 → Console tab

2. **Documentation:**
   - `DEPLOYMENT_GUIDE.md` - Full deployment guide
   - `VERCEL_DEPLOYMENT_STEPS.md` - Vercel specific
   - `RENDER_DEPLOYMENT_STEPS.md` - Render specific

3. **Service Status:**
   - Render: https://status.render.com
   - Vercel: https://vercel-status.com
   - Supabase: https://status.supabase.com

---

## ✅ Final Verification

**All systems operational when:**
- [ ] ✅ Frontend loads without errors
- [ ] ✅ Backend health check passes
- [ ] ✅ Database connected
- [ ] ✅ Login works end-to-end
- [ ] ✅ API calls succeed
- [ ] ✅ No CORS errors
- [ ] ✅ Sample data visible
- [ ] ✅ Admin panel accessible

---

## 🎉 Success Criteria

Your deployment is **PRODUCTION READY** when all these are true:

1. ✅ Users can access frontend
2. ✅ Users can login successfully
3. ✅ Dashboard displays correctly
4. ✅ API data loads
5. ✅ No console errors
6. ✅ Mobile responsive
7. ✅ Admin panel works
8. ✅ Sample data seeded

---

**Congratulations! Your KNHS Portal is live! 🚀**

**Next steps:**
1. Train staff on the system
2. Import real school data
3. Configure academic calendar
4. Customize branding
5. Monitor usage and performance

---

**Deployed with ❤️ for Kiwalan National High School**
