# Sprint 8 Phase 2: Quick Start Guide

**🚀 Get Phase 2 Features Running in 10 Minutes**

---

## 🎯 What's New in Phase 2

1. **Transmutation API** - Dynamic grade calculations
2. **4 Notifications** - Real-time alerts for all users
3. **Grade Locking** - Principal-controlled permanent records
4. **Admin Unlock** - Emergency correction capability

---

## ⚡ Quick Test (10 Minutes)

### 1. Start Servers (2 minutes)

```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Expected:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

---

### 2. Test Transmutation API (1 minute)

```bash
# New terminal
curl http://localhost:8000/api/v1/grades/transmutation_table/
```

**Expected Response:**
```json
{
  "table": [
    {"initial_grade": 100.0, "transmuted_grade": 100},
    ...28 more entries...
  ],
  "passing_grade": 75,
  "grade_range": {"min": 60, "max": 100}
}
```

✅ **PASS** if you see the table data  
❌ **FAIL** if 404 or error

---

### 3. Test Grade Locking UI (3 minutes)

#### Setup
1. Open browser: http://localhost:5173
2. Login as **Principal**
   - Email: principal@knhs.edu.ph
   - Password: password123

#### Test Flow
1. Navigate to: **Approval Center** (sidebar)
2. Look for pending grades (if none, create some as teacher first)
3. Find "**🔒 Lock Grades**" button
4. Click button → Modal should open
5. Check for warnings:
   - ⚠️ "Once locked, grades cannot be edited"
   - ℹ️ "Only admins can unlock"
6. Click "**Lock Grades**" button
7. Look for success message

✅ **PASS** if lock button exists and modal works  
❌ **FAIL** if button missing or error

---

### 4. Test Admin Unlock Page (2 minutes)

#### Setup
1. Logout principal
2. Login as **Admin**
   - Email: admin@knhs.edu.ph
   - Password: password123

#### Test Flow
1. Navigate to: http://localhost:5173/admin/unlock-grades
2. Check page loads (should show security warning)
3. Select quarter from dropdown
4. Look for locked grade sets
5. Click "**🔓 Emergency Unlock**" on any set
6. Modal should open
7. Try to submit without reason → Should block
8. Try with < 20 chars → Should block
9. Cancel modal

✅ **PASS** if admin page loads and validates correctly  
❌ **FAIL** if can't access or no validation

---

### 5. Test Notifications (2 minutes)

#### Setup: Publish Assignment
1. Logout, login as **Teacher**
2. Navigate to: **Create Assignment**
3. Fill form:
   - Title: "Test Assignment"
   - Class: Grade 7-A
   - Due Date: Tomorrow
4. Click "**Publish Assignment**"
5. Look for success message

#### Verify Student Notification
1. Logout teacher
2. Login as **Student** (enrolled in Grade 7-A)
3. Click **Notification Bell** (top right)
4. Look for: "New assignment: Test Assignment"
5. Click notification → Should go to assignment page

✅ **PASS** if notification appears  
❌ **FAIL** if no notification

---

## 🎨 Visual Verification

### ApprovalCenter Should Have:
```
[✅ Approve & Publish]  [❌ Reject]  [🔒 Lock Grades]
```

### AdminUnlockGrades Should Show:
```
┌─────────────────────────────────┐
│ ⚠️ Warning: Emergency use only  │
├─────────────────────────────────┤
│ Quarter: [Q1 2026-2027 ▼]      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Mathematics    [🔒 Locked]  │ │
│ │ [🔓 Emergency Unlock]       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### GradeInput Should Fetch API:
Open DevTools → Network tab → Look for:
```
GET /api/v1/grades/transmutation_table/  200 OK
```

---

## 🐛 Troubleshooting

### Issue: API Returns 404
```bash
# Check if endpoint exists
python manage.py show_urls | grep transmutation

# Expected: /api/v1/grades/transmutation_table/
```

### Issue: Lock Button Not Showing
**Cause:** Grades not in "published" state  
**Fix:** First approve grades, then lock button appears

### Issue: Admin Page Redirects
**Cause:** Not logged in as admin  
**Fix:** Ensure role is "admin" not "principal"

### Issue: Notifications Not Appearing
**Check:**
1. Backend console for errors
2. Database has notifications:
   ```bash
   python manage.py shell
   >>> from apps.communications.models import Notification
   >>> Notification.objects.count()
   ```

### Issue: Frontend Can't Reach Backend
**Fix:** Check CORS settings in backend
```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

---

## 📊 Quick Verification Checklist

After running all tests above:

- [ ] Transmutation API returns data
- [ ] Lock button exists in ApprovalCenter
- [ ] Lock modal opens with warnings
- [ ] Admin unlock page accessible (admin only)
- [ ] Admin unlock validates 20+ chars
- [ ] Student receives assignment notification
- [ ] No console errors in browser
- [ ] No errors in backend logs

**All Checked?** 🎉 Phase 2 is working correctly!

---

## 🔗 Next Steps

### For Development
1. Read full docs: `SPRINT8_PHASE2_COMPLETE.md`
2. Review testing guide: `SPRINT8_PHASE2_TESTING_GUIDE.md`
3. Check visual guide: `SPRINT8_PHASE2_VISUAL_GUIDE.md`

### For Testing
1. Execute all test cases in testing guide (43 tests)
2. Test on multiple browsers
3. Test on mobile devices
4. Performance test with load

### For Deployment
1. Review: `SPRINT8_PHASE2_DEPLOYMENT_CHECKLIST.md`
2. Complete manual testing
3. Get stakeholder approval
4. Deploy to staging
5. User acceptance testing
6. Deploy to production

---

## 🆘 Need Help?

### Common Questions

**Q: Where is the lock button?**  
A: ApprovalCenter → After approving grades → In actions section

**Q: Can teachers lock grades?**  
A: No, only principals and admins

**Q: Can principals unlock grades?**  
A: No, only admins (emergency situations)

**Q: How do I create test data?**  
A: Run seed commands:
```bash
python manage.py seed_academic_data
python manage.py seed_admin
```

**Q: Where are audit logs?**  
A: Database table: `grading_gradepublishevent`
```bash
python manage.py shell
>>> from apps.grading.models import GradePublishEvent
>>> GradePublishEvent.objects.filter(action='unlocked')
```

---

## 📱 Quick Links

- **Backend Admin:** http://localhost:8000/admin
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/api/schema/swagger/
- **Approval Center:** http://localhost:5173/approvals
- **Admin Unlock:** http://localhost:5173/admin/unlock-grades

---

## ✨ Success Indicators

You know Phase 2 works when:

1. ✅ API call to transmutation_table succeeds
2. ✅ Lock button visible after approval
3. ✅ Admin unlock page loads for admins only
4. ✅ Notifications appear in notification center
5. ✅ All buttons work without errors
6. ✅ No console errors
7. ✅ Audit logs created in database

---

**Quick Start Version:** 1.0  
**Last Updated:** June 5, 2026  
**Estimated Time:** 10 minutes  
**Difficulty:** Easy ⭐⭐☆☆☆

---

## 🎓 Video Tutorial (Coming Soon)

Watch step-by-step video guide:
- [ ] Setup and installation
- [ ] Testing transmutation API
- [ ] Grade locking demonstration
- [ ] Admin unlock walkthrough
- [ ] Notification system overview

---

**Ready to test?** Start with step 1 above! 🚀
