import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import {
  AssignmentsIcon,
  GradesIcon,
  MessagesIcon,
  UsersIcon,
  EnrollmentIcon,
  AnnouncementsIcon,
  ApprovalsIcon,
  ReportsIcon,
  StudentsIcon,
} from '../icons/NavigationIcons'

export default function QuickActions() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const QUICK_ACTIONS_BY_ROLE = {
    student: [
      { to: '/assignments', label: 'View Assignments', icon: AssignmentsIcon },
      { to: '/grades', label: 'Check Grades', icon: GradesIcon },
      { to: '/messages', label: 'New Message', icon: MessagesIcon },
    ],
    teacher: [
      { to: '/grades', label: 'Enter Grades', icon: GradesIcon },
      { to: '/attendance', label: 'Take Attendance', icon: GradesIcon },
      { to: '/assignments', label: 'Create Assignment', icon: AssignmentsIcon },
    ],
    admin: [
      { to: '/users', label: 'Add User', icon: UsersIcon },
      { to: '/enrollment', label: 'Enroll Student', icon: EnrollmentIcon },
      { to: '/announcements', label: 'Post Announcement', icon: AnnouncementsIcon },
    ],
    principal: [
      { to: '/approvals', label: 'Review Approvals', icon: ApprovalsIcon },
      { to: '/reports', label: 'View Reports', icon: ReportsIcon },
      { to: '/announcements', label: 'Post Announcement', icon: AnnouncementsIcon },
    ],
    guidance: [
      { to: '/students', label: 'Student Lookup', icon: StudentsIcon },
      { to: '/messages', label: 'New Message', icon: MessagesIcon },
    ],
    registrar: [
      { to: '/enrollment', label: 'Process Enrollment', icon: EnrollmentIcon },
      { to: '/students', label: 'Student Records', icon: StudentsIcon },
    ],
    parent: [
      { to: '/grades', label: 'View Child Grades', icon: GradesIcon },
      { to: '/messages', label: 'Contact School', icon: MessagesIcon },
    ],
  }

  const actions = QUICK_ACTIONS_BY_ROLE[user?.role] || QUICK_ACTIONS_BY_ROLE.student

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:border-knhs-purple hover:text-knhs-purple touch-manipulation"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="hidden sm:inline">Quick Actions</span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2">
              {actions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-knhs-purple touch-manipulation"
                >
                  <action.icon className="h-5 w-5" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
