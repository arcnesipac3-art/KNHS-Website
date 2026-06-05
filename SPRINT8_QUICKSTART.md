# Sprint 8: Quick Start Guide ⚡

## Immediate Deployment (5 Minutes)

### Step 1: Verify Changes ✅
```bash
# Check that all files exist
ls frontend/src/pages/PrincipalDashboard.jsx
ls frontend/src/pages/ApprovalCenter.jsx
ls frontend/src/components/ui/GradeStatusBadge.jsx

# Verify backend change
grep "unlock" backend/apps/grading/views.py | grep approval_queue
```

### Step 2: Test Locally 🧪
```bash
# Terminal 1: Start backend
cd backend
python manage.py runserver

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Step 3: Quick Test Scenarios 🎯

**Test 1: Principal Dashboard**
1. Login as principal user
2. Navigate to `/principal-dashboard`
3. Verify KPIs load
4. Click "Approval Center" button

**Test 2: Approval Center**
1. Should see empty state (or pending grades if any exist)
2. Try quarter dropdown
3. Verify "All caught up" message appears

**Test 3: Teacher Grade Submission**
1. Login as teacher
2. Navigate to `/grades/input`
3. Enter grades for a class
4. Verify button says "Submit for Approval" (not "Publish Grades")
5. Submit grades
6. Verify status shows "Pending Approval"

### Step 4: Deploy to Production 🚀

**Backend (Render/Railway)**
```bash
git add .
git commit -m "Sprint 8 Phase 1: Principal approval workflow"
git push origin main
# Auto-deploys on push
```

**Frontend (Vercel/Netlify)**
```bash
# Already committed above
# Auto-deploys on push
# Or manual: npm run build && deploy
```

---

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify principal can login
- [ ] Check approval center loads
- [ ] Test teacher grade submission
- [ ] Verify students cannot see pending grades
- [ ] Monitor error logs

### Week 1
- [ ] Train principals on approval center
- [ ] Send email to teachers about new workflow
- [ ] Create video tutorial
- [ ] Monitor for bugs/feedback
- [ ] Document any issues

---

## Emergency Rollback

If critical issues occur:

```bash
# Backend
git revert HEAD
git push origin main

# Frontend  
git revert HEAD
git push origin main

# Or restore specific file
git checkout HEAD~1 frontend/src/pages/GradeInput.jsx
git commit -m "Rollback grade input changes"
git push origin main
```

---

## Common Issues & Fixes

### Issue: "Cannot find module 'PrincipalDashboard'"

**Fix:**
```bash
cd frontend
npm install
npm run dev
```

### Issue: 403 Forbidden on approval_queue

**Fix:** Verify user role is 'principal' or 'admin' in database
```sql
SELECT email, role FROM accounts_user WHERE role = 'principal';
```

### Issue: Grades still publishing directly

**Fix:** Clear browser cache or hard refresh (Ctrl+Shift+R)

---

## Support Contacts

**Technical Issues:** Contact IT Department  
**Workflow Questions:** Principal's Office  
**Training Requests:** Academic Coordinator

---

## Feature Flags (If Needed)

To temporarily disable new features:

**Backend:** Comment out permission check (not recommended)
```python
# In views.py line 103
# if self.action in ["publish", "reject", "lock", "unlock", "approval_queue"]:
#     return [IsAdminOrPrincipal()]
```

**Frontend:** Restore placeholder routes in App.jsx (not recommended)

---

## Success Indicators

✅ All green = Ready for production:
- [ ] No console errors
- [ ] All routes load correctly  
- [ ] API calls succeed
- [ ] Buttons respond properly
- [ ] Status badges appear
- [ ] Modal dialogs work

---

## Next Steps After Deployment

1. **Day 1-3:** Monitor closely, fix any bugs
2. **Week 1:** Gather user feedback
3. **Week 2:** Implement Phase 2 enhancements
4. **Week 3-4:** Complete testing and documentation

**Questions?** See SPRINT8_PHASE1_COMPLETE.md for full details.

---

_Quick Start Guide - Sprint 8 Phase 1_  
_Ready to Deploy: June 5, 2026_
