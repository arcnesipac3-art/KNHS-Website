# 🚀 KNHS Portal - Quick Reference Guide

One-page reference for your deployed system.

---

## 🔗 Your Live URLs

| Service | URL | Access |
|---------|-----|--------|
| **Frontend** | `https://your-app.vercel.app` | Public |
| **Backend API** | `https://knhs-website.onrender.com` | API only |
| **Admin Panel** | `https://knhs-website.onrender.com/admin/` | Admins only |
| **API Health** | `https://knhs-website.onrender.com/api/v1/health/` | Public |

---

## 🔑 Default Credentials

**Admin Account:**
```
Email: admin@knhs.edu.ph
Password: admin123
```

⚠️ **CHANGE PASSWORD AFTER FIRST LOGIN!**

---

## 🎛️ Service Dashboards

| Platform | Dashboard URL | Purpose |
|----------|--------------|---------|
| **Vercel** | https://vercel.com/dashboard | Frontend management |
| **Render** | https://dashboard.render.com | Backend management |
| **Supabase** | https://supabase.com/dashboard | Database management |
| **GitHub** | https://github.com/arcnesipac3-art/KNHS-Website | Code repository |

---

## 🔧 Common Tasks

### Update Frontend Code
```bash
cd frontend
# Make changes
git add .
git commit -m "Update message"
git push origin main
# Vercel auto-deploys in 2 minutes
```

### Update Backend Code
```bash
cd backend
# Make changes
git add .
git commit -m "Update message"
git push origin main
# Render auto-deploys in 3-5 minutes
```

### Run Migrations (Render Shell)
```bash
python manage.py makemigrations
python manage.py migrate
```

### Create New User (Render Shell)
```bash
python manage.py createsuperuser
```

### Seed Sample Data (Render Shell)
```bash
python manage.py seed_admin
python manage.py seed_academic_data
python manage.py seed_sprint3_data
```

### View Logs
- **Vercel:** Dashboard → Deployments → View Function Logs
- **Render:** Dashboard → Logs tab (real-time)
- **Browser:** F12 → Console tab

---

## 🗄️ Database Access

### Connection Details
```
Host: aws-1-ap-southeast-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.yfcvmymvpxacwqxsxfpp
Password: arcnesipac23
```

### Full Connection String
```
postgresql://postgres.yfcvmymvpxacwqxsxfpp:arcnesipac23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Access via Render Shell
```bash
python manage.py dbshell
```

### Backup Database (Local)
```bash
pg_dump "postgresql://postgres.yfcvmymvpxacwqxsxfpp:arcnesipac23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" > backup.sql
```

---

## 🔐 Environment Variables

### Render Backend
```
SECRET_KEY=9K3mP7qR2tY5wE8iU1oA4sD6fG9hJ0kL3nM6pQ8xZ2vC5bN7mW1eT4rY
DEBUG=False
DATABASE_URL=postgresql://postgres.yfcvmymvpxacwqxsxfpp:arcnesipac23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
ALLOWED_HOSTS=knhs-website.onrender.com,your-vercel-url.vercel.app
CORS_ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-vercel-url.vercel.app
RENDER=true
PYTHON_VERSION=3.11.0
```

### Vercel Frontend
```
VITE_API_BASE_URL=https://knhs-website.onrender.com
```

---

## 📡 API Endpoints Quick Reference

### Authentication
```
POST   /api/v1/auth/login/          - Login
POST   /api/v1/auth/refresh/        - Refresh token
POST   /api/v1/auth/logout/         - Logout
GET    /api/v1/auth/me/             - Current user
```

### Academic Structure
```
GET    /api/v1/academic-years/      - List academic years
GET    /api/v1/quarters/            - List quarters
GET    /api/v1/subjects/            - List subjects
GET    /api/v1/classrooms/          - List classrooms
POST   /api/v1/classrooms/join/     - Join class with code
```

### Learning
```
GET    /api/v1/assignments/         - List assignments
GET    /api/v1/learning-materials/  - List materials
POST   /api/v1/submissions/         - Submit assignment
```

### Full API Documentation
- Backend: `/backend/API_SPRINT2.md`
- Backend: `/backend/API_SPRINT3.md`

---

## 🐛 Quick Troubleshooting

### Frontend Not Loading
1. Check Vercel deployment status
2. Check browser console (F12) for errors
3. Verify Vercel URL is correct

### Login Not Working
1. Check backend is "Live" in Render
2. Check browser console for CORS errors
3. Verify CORS settings in Render environment variables
4. Wait 30 seconds if backend was sleeping (free tier)

### CORS Error
1. Render → Environment → Verify `CORS_ALLOWED_ORIGINS` has correct Vercel URL
2. Ensure URLs use `https://` not `http://`
3. Redeploy backend after changes

### Backend Error 500
1. Check Render logs for errors
2. Verify DATABASE_URL is correct
3. Check migrations ran successfully

### Database Connection Failed
1. Check Supabase project status
2. Verify DATABASE_URL in Render
3. Test connection in Render Shell: `python manage.py dbshell`

---

## 📊 System Status Check

### Quick Health Check
1. **Frontend:** Visit your Vercel URL
2. **Backend API:** Visit `https://knhs-website.onrender.com/api/v1/health/`
3. **Admin Panel:** Visit `https://knhs-website.onrender.com/admin/`
4. **Database:** Check Supabase dashboard

### All Green When:
- ✅ Vercel shows "Ready"
- ✅ Render shows "Live"
- ✅ Supabase shows "Healthy"
- ✅ Health check returns `{"status": "healthy"}`

---

## 🔄 Deployment Workflow

### For Code Changes:
```
1. Make changes locally
2. Test: npm run dev (frontend) or python manage.py runserver (backend)
3. Commit: git add . && git commit -m "Description"
4. Push: git push origin main
5. Auto-deploy (Vercel: 2min, Render: 3-5min)
6. Verify in production
```

### For Environment Variable Changes:
```
Vercel:
1. Dashboard → Settings → Environment Variables
2. Edit variable
3. Save
4. Redeploy (Deployments → Redeploy)

Render:
1. Dashboard → Environment
2. Edit variable
3. Save (auto-redeploys)
```

---

## 👥 User Roles & Access

| Role | Access Level | Key Features |
|------|-------------|-------------|
| **Student** | Limited | View classes, submit assignments, view grades |
| **Teacher** | Class-level | Create assignments, grade, mark attendance |
| **Adviser** | Advisory + Teaching | All teacher + conduct ratings, SF9 |
| **Admin** | Full system | User management, system settings |
| **Principal** | Oversight | Analytics, approvals, school-wide view |
| **Registrar** | Enrollment | Student records, enrollment management |
| **Guidance** | Support | Student cases, counseling notes |

---

## 💰 Current Costs

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Supabase | Free | $0/mo | 500MB database, 1GB storage |
| Render | Free | $0/mo | 750 hrs/mo, sleeps after 15min |
| Vercel | Free | $0/mo | 100GB bandwidth |
| **Total** | | **$0/mo** | Good for testing/development |

### When to Upgrade:
- **Render Starter ($7/mo):** When users complain about slow initial load
- **Supabase Pro ($25/mo):** When database exceeds 500MB
- **Vercel Pro ($20/mo):** When traffic exceeds 100GB/mo

---

## 📞 Support Resources

### Documentation
- `README.md` - Project overview
- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `DEPLOYMENT_VERIFICATION.md` - Testing checklist
- `VERCEL_DEPLOYMENT_STEPS.md` - Vercel setup
- `RENDER_DEPLOYMENT_STEPS.md` - Render setup

### External Help
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Django Docs:** https://docs.djangoproject.com
- **Supabase Docs:** https://supabase.com/docs

### Service Status
- **Vercel:** https://vercel-status.com
- **Render:** https://status.render.com
- **Supabase:** https://status.supabase.com

---

## 🎯 Next Steps After Deployment

### Immediate (Week 1)
- [ ] Change admin password
- [ ] Test all features thoroughly
- [ ] Train ICT staff on admin panel
- [ ] Create teacher accounts
- [ ] Configure current academic year

### Short Term (Month 1)
- [ ] Import student data
- [ ] Set up class sections
- [ ] Configure subject catalog
- [ ] Train teachers on platform
- [ ] Set up enrollment pipeline

### Long Term
- [ ] Monitor usage and performance
- [ ] Gather user feedback
- [ ] Plan feature enhancements
- [ ] Consider upgrading to paid plans
- [ ] Set up automated backups

---

## 🔒 Security Reminders

- ✅ Change default admin password
- ✅ Keep SECRET_KEY secure
- ✅ Never commit `.env` files
- ✅ Regularly review audit logs
- ✅ Keep dependencies updated
- ✅ Monitor for security advisories

---

## 📱 Access URLs (Save These)

**Frontend:** https://your-app.vercel.app  
**Backend:** https://knhs-website.onrender.com  
**Admin:** https://knhs-website.onrender.com/admin/  

**Dashboards:**  
Vercel: https://vercel.com/dashboard  
Render: https://dashboard.render.com  
Supabase: https://supabase.com/dashboard  
GitHub: https://github.com/arcnesipac3-art/KNHS-Website  

---

**🎓 KNHS Portal - Deployed and Ready!**

*Keep this document handy for quick reference.*
