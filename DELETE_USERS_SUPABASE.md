# How to Delete Users in Supabase (Fix Foreign Key Error)

## The Problem

When trying to delete users from the `accounts_user` table, you get:
```
Unable to delete rows as one of them is currently referenced by a foreign key constraint 
from the table `accounts_userprofile`
DETAIL: Key (id)=(8f24b6b4-ba39-4cab-a4d6-ac376d6e74f1) is still referenced from table accounts_userprofile.
```

**Cause:** The `accounts_userprofile` table has a foreign key to `accounts_user`, and the database requires you to delete the profile first, or delete both together.

---

## Solution Options

### Option 1: Delete Profile First, Then User (Manual Method)

#### Steps in Supabase SQL Editor:

1. **Go to Supabase Dashboard**
   - Visit your Supabase project
   - Click "SQL Editor" in left sidebar

2. **Find the User ID**
   First, let's see what users exist:
   ```sql
   SELECT id, email, role, created_at 
   FROM accounts_user 
   ORDER BY created_at DESC;
   ```

3. **Delete Profile, Then User**
   Replace `USER_ID_HERE` with the actual UUID:
   ```sql
   -- Delete the profile first
   DELETE FROM accounts_userprofile 
   WHERE user_id = 'USER_ID_HERE';
   
   -- Then delete the user
   DELETE FROM accounts_user 
   WHERE id = 'USER_ID_HERE';
   ```

4. **Or Delete Multiple Users**
   If you want to delete ALL non-admin users created in the last hour:
   ```sql
   -- Delete profiles first
   DELETE FROM accounts_userprofile 
   WHERE user_id IN (
     SELECT id FROM accounts_user 
     WHERE role != 'admin' 
     AND created_at > NOW() - INTERVAL '1 hour'
   );
   
   -- Then delete users
   DELETE FROM accounts_user 
   WHERE role != 'admin' 
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

---

### Option 2: Use Cascading Delete (Single Query)

Instead of deleting separately, you can use a SQL query that handles the cascade:

```sql
-- This deletes the user and cascades to profile
DELETE FROM accounts_user 
WHERE id = 'USER_ID_HERE' 
CASCADE;
```

Or delete all test users except admin:
```sql
-- Delete all non-admin users (cascade will handle profiles)
DELETE FROM accounts_user 
WHERE role IN ('student', 'teacher') 
CASCADE;
```

---

### Option 3: Delete All Corrupt Users (Nuclear Option ⚠️)

**WARNING:** This deletes ALL users except the admin. Use only for testing!

```sql
-- First, find your admin user ID
SELECT id, email, role FROM accounts_user WHERE role = 'admin';

-- Then delete everyone else (profiles auto-deleted with CASCADE)
DELETE FROM accounts_userprofile 
WHERE user_id NOT IN (
  SELECT id FROM accounts_user WHERE role = 'admin'
);

DELETE FROM accounts_user 
WHERE role != 'admin';
```

---

## Step-by-Step Guide for Supabase UI

If you prefer using the Supabase table editor:

### Method 1: Delete via Table Editor

1. **Go to Table Editor**
   - Click "Table Editor" in Supabase dashboard
   - Select `accounts_userprofile` table

2. **Delete Profiles First**
   - Find rows where `user_id` matches the user you want to delete
   - Check the checkbox next to each row
   - Click "Delete" button
   - Confirm deletion

3. **Then Delete User**
   - Switch to `accounts_user` table
   - Find the user row
   - Check the checkbox
   - Click "Delete" button
   - Should work now! ✅

### Method 2: Use SQL Editor (Recommended)

1. **Open SQL Editor**
   - Click "SQL Editor" in sidebar
   - Click "New query"

2. **Run This Query**
   ```sql
   -- See all users with their profiles
   SELECT 
     u.id,
     u.email,
     u.role,
     u.created_at,
     p.first_name,
     p.last_name
   FROM accounts_user u
   LEFT JOIN accounts_userprofile p ON u.id = p.user_id
   WHERE u.role != 'admin'
   ORDER BY u.created_at DESC;
   ```

3. **Copy User IDs to Delete**
   Note the `id` values of users you want to remove

4. **Delete Them**
   ```sql
   -- Replace with actual IDs
   DELETE FROM accounts_userprofile 
   WHERE user_id IN (
     '8f24b6b4-ba39-4cab-a4d6-ac376d6e74f1',
     'another-user-id-here'
   );
   
   DELETE FROM accounts_user 
   WHERE id IN (
     '8f24b6b4-ba39-4cab-a4d6-ac376d6e74f1',
     'another-user-id-here'
   );
   ```

---

## Fix the Model (Prevent This in Future)

The proper fix is to add `on_delete=models.CASCADE` to the model. Let me check if this is already set up:

### Current Model Should Have:

```python
# In backend/apps/accounts/models.py
class UserProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,  # ✅ This should be set
        related_name='profile'
    )
```

If `on_delete=models.CASCADE` is set, then deleting a user should auto-delete the profile. If it's not working, it might be a database-level constraint issue.

---

## Quick Commands Reference

### Delete Single User (Profile + User)
```sql
-- Replace USER_EMAIL with actual email
DELETE FROM accounts_userprofile 
WHERE user_id = (SELECT id FROM accounts_user WHERE email = 'USER_EMAIL');

DELETE FROM accounts_user 
WHERE email = 'USER_EMAIL';
```

### Delete All Students
```sql
DELETE FROM accounts_userprofile 
WHERE user_id IN (SELECT id FROM accounts_user WHERE role = 'student');

DELETE FROM accounts_user 
WHERE role = 'student';
```

### Delete All Teachers
```sql
DELETE FROM accounts_userprofile 
WHERE user_id IN (SELECT id FROM accounts_user WHERE role = 'teacher');

DELETE FROM accounts_user 
WHERE role = 'teacher';
```

### Delete All Test Users (Keep Only Admin)
```sql
-- Delete profiles
DELETE FROM accounts_userprofile 
WHERE user_id IN (SELECT id FROM accounts_user WHERE role != 'admin');

-- Delete users
DELETE FROM accounts_user 
WHERE role != 'admin';
```

### Check What Will Be Deleted (Safe Preview)
```sql
-- See what would be deleted
SELECT u.id, u.email, u.role, p.first_name, p.last_name
FROM accounts_user u
LEFT JOIN accounts_userprofile p ON u.id = p.user_id
WHERE u.role != 'admin';
```

---

## After Deleting Users

1. **Verify Deletion**
   ```sql
   -- Should only show admin
   SELECT email, role FROM accounts_user;
   ```

2. **Check Orphaned Profiles** (shouldn't exist, but check)
   ```sql
   -- Should return 0 rows
   SELECT * FROM accounts_userprofile 
   WHERE user_id NOT IN (SELECT id FROM accounts_user);
   ```

3. **Create New Users via Portal**
   - Go to: https://knhs-website.vercel.app/users/create
   - Create users properly with the fixed code
   - They should appear in list immediately ✅

---

## Why This Happens

PostgreSQL (Supabase) enforces foreign key constraints strictly:
- `accounts_userprofile.user_id` references `accounts_user.id`
- You can't delete a user if their profile still exists
- Django's ORM usually handles this with CASCADE
- Direct database deletion requires manual cascade handling

---

## Safe Deletion Script (Copy-Paste Ready)

```sql
-- STEP 1: See what you're about to delete
SELECT 
  u.id,
  u.email,
  u.role,
  u.created_at,
  CASE 
    WHEN p.first_name IS NULL THEN '(no profile data)'
    ELSE p.first_name || ' ' || p.last_name
  END as name
FROM accounts_user u
LEFT JOIN accounts_userprofile p ON u.id = p.user_id
WHERE u.role != 'admin'
ORDER BY u.created_at DESC;

-- STEP 2: If you're sure, delete them (profiles first, then users)
DELETE FROM accounts_userprofile 
WHERE user_id IN (
  SELECT id FROM accounts_user WHERE role != 'admin'
);

DELETE FROM accounts_user 
WHERE role != 'admin';

-- STEP 3: Verify only admin remains
SELECT email, role FROM accounts_user;
```

---

## Summary

**Problem:** Can't delete users due to foreign key constraint  
**Cause:** Profile must be deleted before user  
**Solution:** Delete profile first, then user (or use CASCADE)  
**Best Method:** Use SQL Editor with the safe deletion script above  

**After deletion:** Create new users via the portal with the fixed code! ✅
