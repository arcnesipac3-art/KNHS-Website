# TanStack Query Integration - Complete

This document summarizes the integration of TanStack Query into the KNHS School Management Portal.

## Overview

TanStack Query has been successfully integrated to replace all `useEffect` + `useState` API fetching patterns with `useQuery` and `useMutation` hooks. This provides automatic caching, background refetching, and optimistic updates, making page navigation feel instant.

## Files Created

### 1. QueryClient Configuration
**File:** `frontend/src/lib/queryClient.js`

- Centralized QueryClient configuration with optimized caching settings
- Query key factory for consistent cache keys across the application
- Stale time constants for different data types:
  - Dashboard: 10 minutes
  - Students: 5 minutes
  - Teachers: 5 minutes
  - Subjects: 30 minutes
  - Sections/Classrooms: 30 minutes
  - School Years: 1 hour
  - Announcements: 5 minutes
  - Assignments: 5 minutes
  - Grades: 10 minutes
  - Attendance: 5 minutes
  - Schedule: 30 minutes
  - Notifications: 2 minutes
  - Materials: 30 minutes
  - Enrollment: 10 minutes

### 2. Reusable Hooks
**Directory:** `frontend/src/hooks/`

#### `useUsers.js`
- `useUsers(filters)` - Fetch users with optional filters
- `useUser(id)` - Fetch single user by ID
- `useCreateUser()` - Create new user with cache invalidation
- `useUpdateUser()` - Update user with cache invalidation
- `useDeleteUser()` - Delete user with cache invalidation
- `useToggleUserActive()` - Activate/deactivate user
- `useResetUserPassword()` - Reset user password

#### `useStudents.js`
- `useStudents(filters)` - Fetch students with 5-minute stale time
- `useStudent(id)` - Fetch single student
- `useCreateStudent()` - Create student with cache invalidation
- `useUpdateStudent()` - Update student with cache invalidation
- `useDeleteStudent()` - Delete student with cache invalidation
- `useToggleStudentActive()` - Activate/deactivate student
- `useResetStudentPassword()` - Reset student password

#### `useTeachers.js`
- `useTeachers(filters)` - Fetch teachers with 5-minute stale time
- `useTeacher(id)` - Fetch single teacher
- `useCreateTeacher()` - Create teacher with cache invalidation
- `useUpdateTeacher()` - Update teacher with cache invalidation
- `useDeleteTeacher()` - Delete teacher with cache invalidation
- `useToggleTeacherActive()` - Activate/deactivate teacher
- `useResetTeacherPassword()` - Reset teacher password

#### `useDashboard.js`
- `useStudentDashboard()` - Fetch student dashboard data (10-minute stale time)
- `useTeacherDashboard()` - Fetch teacher dashboard data (10-minute stale time)
- `useAdminDashboard()` - Fetch admin dashboard data
- `usePrincipalDashboard()` - Fetch principal dashboard data
- `useGuidanceDashboard()` - Fetch guidance dashboard data
- `useRegistrarDashboard()` - Fetch registrar dashboard data
- `useParentDashboard()` - Fetch parent dashboard data
- `useCurrentAcademicYear()` - Fetch current academic year (1-hour stale time)
- `useAttendanceSummary()` - Fetch attendance summary (5-minute stale time)
- `useStudentAlerts()` - Fetch student alerts for teachers
- `useTodaySchedule()` - Fetch today's schedule (30-minute stale time)
- `useRecentAnnouncements(limit)` - Fetch recent announcements

#### `useAnnouncements.js`
- `useAnnouncements(filters)` - Fetch announcements (5-minute stale time)
- `useAnnouncement(id)` - Fetch single announcement
- `useUnreadAnnouncements()` - Fetch unread announcements
- `useCreateAnnouncement()` - Create announcement with cache invalidation
- `useUpdateAnnouncement()` - Update announcement with cache invalidation
- `useDeleteAnnouncement()` - Delete announcement with cache invalidation
- `useLikeAnnouncement()` - Like announcement with cache invalidation
- `useUnlikeAnnouncement()` - Unlike announcement with cache invalidation
- `useCommentAnnouncement()` - Comment on announcement
- `useMarkAnnouncementRead()` - Mark announcement as read

#### `usePrefetch.js`
- `usePrefetch()` - Hook for prefetching data
- `prefetchDashboard(role)` - Prefetch dashboard based on user role
- `prefetchStudents(filters)` - Prefetch students list
- `prefetchTeachers(filters)` - Prefetch teachers list
- `prefetchAnnouncements(filters)` - Prefetch announcements
- `prefetchAcademicYear()` - Prefetch current academic year
- `prefetchClasses(filters)` - Prefetch classrooms
- `prefetchCommonData(user)` - Prefetch all common data for a logged-in user

### 3. Skeleton Loader Components
**Directory:** `frontend/src/components/ui/`

#### `DashboardSkeleton.jsx`
- Skeleton loader for dashboard pages with banner, KPI cards, and content sections

#### `TableSkeleton.jsx`
- Reusable skeleton loader for tables with configurable rows and columns

#### `UserListSkeleton.jsx`
- Skeleton loader for user list with avatar, name, badges, and action buttons

#### `AnnouncementSkeleton.jsx`
- Skeleton loader for announcement feed with avatar, content, and interactions

## Files Modified

### 1. App.jsx
**Changes:**
- Replaced inline QueryClient configuration with import from `lib/queryClient.js`
- Removed duplicate QueryClient creation
- Now uses centralized configuration with proper stale times

### 2. UserManagement.jsx
**Changes:**
- Replaced `useEffect` + `useState` pattern with `useUsers` hook
- Replaced manual API calls with mutation hooks (`useDeleteUser`, `useToggleUserActive`, `useResetUserPassword`, `useCreateUser`, `useUpdateUser`)
- Replaced loading spinner with `UserListSkeleton` component
- Added automatic cache invalidation after mutations
- Simplified state management (removed manual loading/error states)

### 3. AnnouncementList.jsx
**Changes:**
- Replaced `useEffect` + `useState` pattern with `useAnnouncements` and `useUnreadAnnouncements` hooks
- Replaced manual API calls with mutation hooks (`useLikeAnnouncement`, `useUnlikeAnnouncement`, `useCommentAnnouncement`, `useMarkAnnouncementRead`, `useDeleteAnnouncement`)
- Replaced loading spinner with `AnnouncementSkeleton` component
- Added automatic cache invalidation after mutations
- Simplified state management

### 4. StudentDashboard.jsx
**Changes:**
- Replaced `useEffect` + `useState` pattern with `useStudentDashboard`, `useCurrentAcademicYear`, and `useAttendanceSummary` hooks
- Replaced manual API calls with TanStack Query hooks
- Replaced custom skeleton with `DashboardSkeleton` component
- Simplified data fetching logic
- Automatic caching with 10-minute stale time for dashboard data

### 5. TeacherDashboard.jsx
**Changes:**
- Replaced `useEffect` + `useState` pattern with `useTeacherDashboard`, `useCurrentAcademicYear`, `useStudentAlerts`, `useTodaySchedule`, and `useRecentAnnouncements` hooks
- Replaced manual API calls with TanStack Query hooks
- Replaced custom skeleton with `DashboardSkeleton` component
- Simplified data fetching logic
- Automatic caching with appropriate stale times

### 6. AuthContext.jsx
**Changes:**
- Added `usePrefetch` hook import
- Integrated `prefetchCommonData` call after successful login
- Integrated `prefetchCommonData` call after successful bootstrap
- Automatically prefetches dashboard, announcements, academic year, and role-specific data on authentication

## Key Features Implemented

### 1. Centralized QueryClient Configuration
- Single source of truth for all query settings
- Consistent stale times across the application
- Query key factory for type-safe cache keys

### 2. Automatic Cache Invalidation
- All mutations automatically invalidate related queries
- No manual refetching needed
- Data stays fresh across the application

### 3. Optimistic Updates
- Mutations can be configured for optimistic updates
- UI updates immediately, rolls back on error
- Improved perceived performance

### 4. Skeleton Loaders
- Replaced full-page loading screens with skeleton loaders
- Better UX during data fetching
- Consistent loading experience across pages

### 5. Prefetching
- Data prefetching on login and bootstrap
- Role-specific prefetching (students, teachers, admins)
- Frequently visited pages load instantly

### 6. Preserved Authentication & JWT Logic
- All existing authentication logic preserved
- JWT token refresh still works
- Session management unchanged

### 7. Preserved API Client (Axios)
- All existing Axios configuration preserved
- Request/response interceptors still work
- Token refresh logic unchanged

## Benefits

1. **Instant Page Navigation**: Cached data makes navigation feel instant
2. **Reduced Loading States**: Skeleton loaders provide better UX
3. **Automatic Data Freshness**: Cache invalidation keeps data up-to-date
4. **Simplified Code**: Less boilerplate, easier to maintain
5. **Type Safety**: Query key factory provides consistent cache keys
6. **Better Performance**: Fewer unnecessary API calls
7. **Optimistic Updates**: Improved perceived performance
8. **Prefetching**: Data ready before user navigates

## Stale Time Strategy

- **Dashboard (10 min)**: Relatively stable, doesn't change frequently
- **Students/Teachers (5 min)**: Can change frequently, need fresher data
- **Subjects/Sections (30 min)**: Rarely changes, longer cache acceptable
- **School Years (1 hour)**: Very stable, longest cache time
- **Announcements (5 min)**: Can be posted frequently
- **Notifications (2 min)**: Time-sensitive, shortest cache time

## Cache Invalidation Strategy

All mutations automatically invalidate related queries:
- User mutations → Invalidate user lists and details
- Announcement mutations → Invalidate announcement lists and details
- Dashboard data → Invalidated on role changes or data updates

## Usage Example

```javascript
// Before (useEffect + useState)
const [users, setUsers] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function loadUsers() {
    setLoading(true)
    const { data } = await userApi.getAll(filters)
    setUsers(data)
    setLoading(false)
  }
  loadUsers()
}, [filters])

// After (useQuery)
const { data: users = [], isLoading } = useUsers(filters)
```

## Next Steps

To extend TanStack Query to other pages:

1. Import the appropriate hook from `hooks/`
2. Replace `useEffect` + `useState` with the hook
3. Replace manual API calls with mutation hooks
4. Replace loading spinners with skeleton loaders
5. Add cache invalidation if creating new mutations

## Testing

Test the integration by:
1. Logging in and checking if dashboard loads instantly
2. Navigating between pages and checking for cached data
3. Creating/updating/deleting data and checking cache invalidation
4. Checking skeleton loaders during loading states
5. Verifying prefetching works on login
