# Troubleshooting: Users Not Appearing After Creation

## Issue
After creating users successfully (getting 201 Created response), they don't appear in the user list.

## Root Cause
The backend deployment on Render doesn't have the latest fixes. The critical fix for profile creation (commit `5c311f7`) needs to be deployed.

---

## Quick Diagnosis

### Step 1: Check What's Deployed on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Select your backend service

2. **Check Latest Deployment**
   - Look at "Events" tab
   - Check which commit is currently deployed
   - **Should be:** `dc971e8` or `622f220` (latest with all fixes)
   - **If it's older:** Deployment hasn't triggered yet

### Step 2: Check Browser Console

Open browser console (F12) and check the network tab:

**When creating user:**
```
POST https://knhs-website.onrender.com/api/v1/users/
Status: 201 Created ✅
```

**When loading user list:**
```
GET https://knhs-website.onrender.com/api/v1/users/
Status: 200 OK
Response: [] (empty array) ❌
```

This confirms users are being created but not returned in the list.

---

## Solution Options

### Option A: Wait for Auto-Deploy (Recommended)

**If Render is set to auto-deploy from GitHub:**

1. **Check Deployment Status**
   - Render dashboard → Your service → "Events" tab
   - Look for deployment triggered by latest push
   - Should see: "Deploying commit 622f220..." or similar

2. **Wait for Completion**
   - Deployments take ~5-8 minutes
   - Status will change from "Building" → "Live"

3. **Verify After Deployment**
   - Refresh https://knhs-website.vercel.app/users
   - Create new test user
   - Should appear immediately ✅

### Option B: Manual Deploy

**If auto-deploy isn't working:**

1. **Go to Render Dashboard**
   - Select your backend service
   - Click "Manual Deploy" button
   - Choose branch: `main`
   - Click "Deploy"

2. **Wait for Completion** (~5-8 minutes)

3. **Test After Deployment**

### Option C: Run Fix Command Immediately

**Use the fix command for existing users:**

1. **Open Render Shell**
   - Dashboard → Your service → "Shell" button (left sidebar)

2. **Run Fix Command**
   ```bash
   python manage.py fix_user_profiles
   ```

3. **Output Should Show:**
   ```
   Found 3 users to check
   ✓ User admin@knhs.edu.ph profile OK: Admin User
   ✓ Created profile for student1@test.com
   User student2@test.com has empty profile - needs manual update
   
   ✓ Profile fix complete!
   ```

4. **Refresh User List**
   - Go to https://knhs-website.vercel.app/users
   - Users should now appear! ✅

---

## Verify the Fix is Deployed

### Check Backend Version

**Method 1: Check Render Dashboard**
- Events tab should show latest commit deployed
- Look for commit message: "feat: production-ready improvements..."

**Method 2: Test API Directly**

Open terminal and run:
```bash
curl https://knhs-website.onrender.com/api/v1/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Should return array of users, not empty.

---

## Create New User After Fix

Once the fix is deployed, new users will work correctly:

1. **Go to Create User Page**
   - https://knhs-website.vercel.app/users/create

2. **Fill Out Form Completely**
   - Email: student@test.com
   - First Name, Last Name
   - Role: Student
   - LRN: 123456789012 (exactly 12 digits)
   - Grade Level: 11
   - Generate Password

3. **Click Create**
   - Should see success message with temp password
   - Wait 5 seconds for redirect

4. **Check User List**
   - https://knhs-website.vercel.app/users
   - New user should appear immediately! ✅

---

## Still Not Working?

### Debug Steps

1. **Check Network Tab in Browser**
   - F12 → Network tab
   - Create user
   - Look at POST /api/v1/users/ response
   - Check GET /api/v1/users/ response

2. **Check for Errors**
   ```
   POST /users/ → 201 Created ✅ (user created)
   GET /users/ → 200 OK but empty array ❌ (not returning)
   ```

3. **Check Render Logs**
   - Dashboard → Your service → "Logs" tab
   - Look for errors during user creation
   - Look for profile-related errors

### Common Issues

**Issue 1: Old Backend Still Running**
- **Solution:** Force manual deploy from Render dashboard
- **Or:** Wait 10 minutes for auto-deploy to complete

**Issue 2: Database Out of Sync**
- **Solution:** Run migrations on Render:
  ```bash
  python manage.py migrate
  ```

**Issue 3: Empty Profiles**
- **Solution:** Run fix command:
  ```bash
  python manage.py fix_user_profiles
  ```

**Issue 4: Frontend Cached**
- **Solution:** Hard refresh (Ctrl+Shift+R)
- **Or:** Clear browser cache

---

## Expected Timeline

### Auto-Deploy Process

1. **Code pushed to GitHub** → Done ✅
2. **Render detects push** → ~1-2 minutes
3. **Build starts** → ~2-3 minutes
4. **Deploy & migrations** → ~2-3 minutes
5. **Service restarts** → ~30 seconds
6. **Total:** ~5-10 minutes from push

### Current Status

Check these commits are deployed on Render:
- ✅ `5c311f7` - Fix profile duplication (CRITICAL)
- ✅ `dc971e8` - Production-ready improvements
- ✅ `622f220` - Documentation
- ✅ `0797e53` - People redirect

**If these aren't deployed yet**, users won't appear in the list.

---

## Quick Checklist

Before creating new users, verify:

- [ ] Render shows latest commit deployed
- [ ] Render service status is "Live" (not "Building")
- [ ] Vercel shows latest deployment
- [ ] Browser cache cleared (hard refresh)
- [ ] Network tab shows no errors
- [ ] Logged in as admin user

After creating user, verify:

- [ ] POST /users/ returns 201 Created
- [ ] Response includes user.id and profile data
- [ ] Success message shows temp password
- [ ] After redirect, user appears in list
- [ ] User has full_name displayed
- [ ] LRN or employee_id shown

---

## For Existing Users Created Before Fix

**These users have corrupt profiles and won't appear.**

**Options:**

1. **Delete from Supabase** (see DELETE_USERS_SUPABASE.md)
   ```sql
   DELETE FROM accounts_userprofile WHERE user_id IN (
     SELECT id FROM accounts_user WHERE role != 'admin'
   );
   DELETE FROM accounts_user WHERE role != 'admin';
   ```

2. **Run Fix Command** (see FIX_EXISTING_USERS.md)
   ```bash
   python manage.py fix_user_profiles
   ```

3. **Recreate via portal** after fix is deployed

---

## Test Verification Script

Once deployed, test with these steps:

```bash
# 1. Create test user via UI
Email: test-$(date +%s)@test.com
Role: Student
LRN: $(date +%s | tail -c 13)
Grade: 11

# 2. Check it appears immediately in list
Navigate to /users → Should see new user

# 3. Edit the user
Click edit → Change first name → Save → Should update

# 4. Deactivate user
Click X button → Confirm → Status changes to Inactive

# 5. Reactivate user
Click check button → Status changes to Active

# All working? ✅ System is production-ready!
```

---

## Contact Points

- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Production Site:** https://knhs-website.vercel.app
- **Backend API:** https://knhs-website.onrender.com

---

## Summary

**Problem:** Users created but don't appear in list  
**Cause:** Backend not deployed with profile fix  
**Solution:** Wait for Render deployment or trigger manual deploy  
**ETA:** ~5-10 minutes from last push  
**Verify:** Check Render dashboard events tab  
**Test:** Create new user after deployment completes  

Once deployed, all new users will work correctly! ✅
