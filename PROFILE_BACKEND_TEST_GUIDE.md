# 🧪 Profile & Settings Backend API Testing Guide

**Date:** June 5, 2026  
**Purpose:** Manual testing guide for Profile & Settings API endpoints

---

## Prerequisites

- Backend deployed on Render: https://knhs-backend.onrender.com
- Valid access token from login
- Test user account

---

## Test 1: Update Profile

### Request
```bash
curl -X PATCH https://knhs-backend.onrender.com/api/v1/auth/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "phone": "09123456789",
    "avatar_url": "https://ui-avatars.com/api/?name=Juan+Dela+Cruz"
  }'
```

### Expected Response (200 OK)
```json
{
  "id": "uuid",
  "email": "student@knhs.edu.ph",
  "role": "student",
  "display_name": "Juan Dela Cruz",
  "is_active": true,
  "is_verified": true,
  "is_approved": true,
  "must_change_password": false,
  "created_at": "2024-01-15T10:30:00Z",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "phone": "09123456789",
  "avatar_url": "https://ui-avatars.com/api/?name=Juan+Dela+Cruz",
  "lrn": "123456789012",
  "grade_level": 11,
  "strand": "STEM",
  "employee_id": null
}
```

---

## Test 2: Update Single Field

### Request
```bash
curl -X PATCH https://knhs-backend.onrender.com/api/v1/auth/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09987654321"
  }'
```

### Expected Response (200 OK)
Returns full user object with updated phone.

---

## Test 3: Change Password (Success)

### Request
```bash
curl -X POST https://knhs-backend.onrender.com/api/v1/auth/change-password/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "testpass123",
    "new_password": "newpass456"
  }'
```

### Expected Response (200 OK)
```json
{
  "detail": "Password updated successfully."
}
```

---

## Test 4: Change Password (Wrong Old Password)

### Request
```bash
curl -X POST https://knhs-backend.onrender.com/api/v1/auth/change-password/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "wrongpassword",
    "new_password": "newpass456"
  }'
```

### Expected Response (400 Bad Request)
```json
{
  "error": "Current password is incorrect.",
  "old_password": ["Current password is incorrect."]
}
```

---

## Test 5: Update Profile Without Auth

### Request
```bash
curl -X PATCH https://knhs-backend.onrender.com/api/v1/auth/profile/ \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test"
  }'
```

### Expected Response (401 Unauthorized)
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Test 6: Verify Updated Data in /me/ Endpoint

### Request
```bash
curl -X GET https://knhs-backend.onrender.com/api/v1/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Expected Response (200 OK)
Should return user data with updated profile fields from previous tests.

---

## Frontend Testing Checklist

### Profile Page
- [ ] Load profile page - displays current user data
- [ ] Click "Edit Profile" - form becomes editable
- [ ] Update first name, last name, phone
- [ ] Click "Save Changes" - success message appears
- [ ] Verify data updated in UI
- [ ] Check sidebar - display name updated
- [ ] Refresh page - changes persist

### Change Password Page
- [ ] Navigate to change password page
- [ ] Enter incorrect current password - error shown
- [ ] Enter correct current password
- [ ] Enter new password (min 8 chars)
- [ ] Confirm new password matches
- [ ] Submit - success message appears
- [ ] Auto-redirect to profile after 2 seconds
- [ ] Log out and log back in with new password

### Notification Settings Page
- [ ] Toggle email notification switches
- [ ] Toggle in-app notification switches
- [ ] Click "Save Preferences"
- [ ] Success message appears
- [ ] Refresh page - settings persist (local state for MVP)

---

## Browser DevTools Testing

### Check Network Tab
1. Open DevTools → Network
2. Update profile → Look for PATCH /auth/profile/
3. Verify request body matches form data
4. Verify response contains updated user object
5. Check Authorization header present

### Check Console
1. No errors should appear
2. Check for successful API responses
3. Verify user context updated

---

## Integration Testing with Live Site

### Vercel Frontend
- URL: https://knhs-portal.vercel.app
- Test all profile/settings flows
- Verify API calls go to Render backend
- Check CORS works correctly

### Expected Behavior
- ✅ Profile updates save and reflect immediately
- ✅ Password change works and allows re-login
- ✅ Error messages display clearly
- ✅ Success messages show and auto-hide
- ✅ Navigation works smoothly
- ✅ No console errors

---

## Troubleshooting

### Profile Update Fails
1. Check access token is valid
2. Check CORS settings on backend
3. Verify user profile exists (created via signal)
4. Check request payload format

### Password Change Fails
1. Verify old password is correct
2. Check new password meets requirements (min 8 chars)
3. Verify user is authenticated
4. Check backend logs on Render

### Data Not Persisting
1. Check database connection
2. Verify UserProfile model has fields
3. Check migrations applied
4. Review backend logs

---

## Quick Test with Admin Panel

### Using Django Admin
1. Go to https://knhs-backend.onrender.com/admin/
2. Log in with admin credentials
3. Navigate to User Profiles
4. Manually update a test user's profile
5. Verify changes appear in frontend

---

## Deployment Verification

### After Push to Main
1. Render auto-deploys backend
2. Wait ~3-5 minutes for build
3. Check Render dashboard for successful deploy
4. Test endpoints with curl or Postman
5. Test frontend integration on Vercel

---

## Success Criteria

✅ All API endpoints return expected status codes  
✅ Profile updates save to database  
✅ Password changes work and persist  
✅ Error messages are clear and helpful  
✅ Frontend displays updated data immediately  
✅ No console errors or warnings  
✅ All diagnostics clean  
✅ CORS configured correctly  
✅ Authentication enforced on protected endpoints  

---

**Testing Completed:** After deployment verification  
**Status:** Ready for Testing ✅
