import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import NotificationPanel from '../notifications/NotificationPanel'
import Breadcrumb from '../ui/Breadcrumb'
import QuickActions from '../ui/QuickActions'
import SearchBar from '../ui/SearchBar'
import { ROLE_LABELS, school } from '../../styles/design-tokens'
import {
  DashboardIcon,
  ClassesIcon,
  ScheduleIcon,
  AssignmentsIcon,
  GradesIcon,
  AttendanceIcon,
  MessagesIcon,
  AnnouncementsIcon,
  UsersIcon,
  EnrollmentIcon,
  ReportCardsIcon,
  ReportsIcon,
  AnalyticsIcon,
  ContentEditorIcon,
  SettingsIcon,
  ApprovalsIcon,
  StudentsIcon,
  ParentDashboardIcon,
} from '../icons/NavigationIcons'

const NAV_BY_ROLE = {
  student: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/classes', label: 'My Classes', icon: ClassesIcon },
      { to: '/schedule', label: 'Schedule', icon: ScheduleIcon },
    ]},
    { section: 'Academics', items: [
      { to: '/assignments', label: 'Assignments', icon: AssignmentsIcon },
      { to: '/grades', label: 'Grades', icon: GradesIcon },
      { to: '/attendance', label: 'Attendance', icon: AttendanceIcon },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: MessagesIcon },
      { to: '/announcements', label: 'Announcements', icon: AnnouncementsIcon },
    ]},
  ],
  teacher: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/classes', label: 'My Classes', icon: ClassesIcon },
      { to: '/schedule', label: 'Schedule', icon: ScheduleIcon },
    ]},
    { section: 'Academics', items: [
      { to: '/assignments', label: 'Assignments', icon: AssignmentsIcon },
      { to: '/grades', label: 'Grades', icon: GradesIcon },
      { to: '/attendance', label: 'Attendance', icon: AttendanceIcon },
      { to: '/report-cards', label: 'Report Cards', icon: ReportCardsIcon },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: MessagesIcon },
      { to: '/announcements', label: 'Announcements', icon: AnnouncementsIcon },
    ]},
  ],
  admin: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
    ]},
    { section: 'User Management', items: [
      { to: '/users', label: 'Users', icon: UsersIcon },
      { to: '/enrollment', label: 'Enrollment', icon: EnrollmentIcon },
    ]},
    { section: 'Academic Management', items: [
      { to: '/classes', label: 'Classes', icon: ClassesIcon },
      { to: '/report-cards', label: 'Report Cards', icon: ReportCardsIcon },
    ]},
    { section: 'Content & Communication', items: [
      { to: '/content-editor', label: 'Content Editor', icon: ContentEditorIcon },
      { to: '/announcements', label: 'Announcements', icon: AnnouncementsIcon },
      { to: '/messages', label: 'Messages', icon: MessagesIcon },
    ]},
    { section: 'System', items: [
      { to: '/reports', label: 'Reports', icon: ReportsIcon },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ]},
  ],
  principal: [
    { section: 'Executive', items: [
      { to: '/dashboard', label: 'Executive Dashboard', icon: DashboardIcon },
      { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
      { to: '/approvals', label: 'Approval Center', icon: ApprovalsIcon },
    ]},
    { section: 'Management', items: [
      { to: '/users', label: 'Users', icon: UsersIcon },
      { to: '/report-cards', label: 'Report Cards', icon: ReportCardsIcon },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: MessagesIcon },
      { to: '/announcements', label: 'Announcements', icon: AnnouncementsIcon },
    ]},
    { section: 'System', items: [
      { to: '/reports', label: 'Reports', icon: ReportsIcon },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ]},
  ],
  guidance: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/students', label: 'Student Lookup', icon: StudentsIcon },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: MessagesIcon },
      { to: '/announcements', label: 'Announcements', icon: AnnouncementsIcon },
    ]},
  ],
  registrar: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/enrollment', label: 'Enrollment Queue', icon: EnrollmentIcon },
    ]},
    { section: 'Records', items: [
      { to: '/students', label: 'Student Records', icon: StudentsIcon },
      { to: '/users', label: 'User Accounts', icon: UsersIcon },
    ]},
    { section: 'Reports', items: [
      { to: '/reports', label: 'Reports & Exports', icon: ReportsIcon },
    ]},
  ],
  parent: [
    { section: 'Main', items: [
      { to: '/parent-dashboard', label: 'Dashboard', icon: ParentDashboardIcon },
      { to: '/grades', label: 'Child Grades', icon: GradesIcon },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: MessagesIcon },
      { to: '/announcements', label: 'Announcements', icon: AnnouncementsIcon },
    ]},
  ],
}

function navClass({ isActive }) {
  return [
    'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors touch-manipulation',
    isActive
      ? 'border-l-4 border-knhs-purple bg-purple-50 text-knhs-purple'
      : 'text-gray-600 hover:bg-gray-50 hover:text-knhs-purple',
  ].join(' ')
}

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.student
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex md:overflow-hidden z-10">
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-knhs-purple text-sm font-bold text-white">
              KN
            </div>
            <h1 className="mt-3 text-sm font-bold text-knhs-purple">{school.shortName}</h1>
            <p className="text-xs text-muted">{school.tagline}</p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navItems.map((section) => (
              <div key={section.section} className="mb-4">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  {section.section}
                </h3>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-gray-100 px-4 py-4">
            <Link to="/profile" className="mb-3 flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-knhs-purple">
              <SettingsIcon className="h-5 w-5" />
              Profile & Settings
            </Link>
            <p className="truncate text-sm font-medium text-text">{user?.display_name}</p>
            <p className="text-xs text-muted">{ROLE_LABELS[user?.role]}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-knhs-purple hover:text-knhs-purple"
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:ml-64">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3 md:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <Breadcrumb />
                <h2 className="mt-1 text-base font-semibold text-text sm:text-lg truncate">{school.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <SearchBar />
              </div>
              <div className="hidden sm:block">
                <QuickActions />
              </div>
              <NotificationPanel />
              <Link
                to="/"
                className="hidden sm:block text-sm font-medium text-knhs-purple hover:text-knhs-purple-light"
              >
                Public site
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white">
              <div className="border-b border-gray-100 px-5 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-knhs-purple text-sm font-bold text-white">
                  KN
                </div>
                <h1 className="mt-3 text-sm font-bold text-knhs-purple">{school.shortName}</h1>
                <p className="text-xs text-muted">{school.tagline}</p>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((section) => (
                  <div key={section.section} className="mb-4">
                    <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                      {section.section}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={navClass}
                        >
                          <item.icon className="mr-2 h-5 w-5" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="border-t border-gray-100 px-4 py-4">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-3 flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-knhs-purple"
                >
                  <SettingsIcon className="h-5 w-5" />
                  Profile & Settings
                </Link>
                <p className="truncate text-sm font-medium text-text">{user?.display_name}</p>
                <p className="text-xs text-muted">{ROLE_LABELS[user?.role]}</p>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-knhs-purple hover:text-knhs-purple"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
