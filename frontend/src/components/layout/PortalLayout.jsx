import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import DepEdHeader from './DepEdHeader'
import NotificationPanel from '../notifications/NotificationPanel'
import { ROLE_LABELS, school } from '../../styles/design-tokens'

const NAV_BY_ROLE = {
  student: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/classes', label: 'My Classes' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/grades', label: 'Grades' },
    { to: '/announcements', label: 'Announcements' },
  ],
  teacher: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/classes', label: 'My Classes' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/grades', label: 'Grades' },
    { to: '/report-cards', label: 'Report Cards' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/announcements', label: 'Announcements' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/enrollment', label: 'Enrollment' },
    { to: '/classes', label: 'Classes' },
    { to: '/report-cards', label: 'Report Cards' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/settings', label: 'Settings' },
  ],
  principal: [
    { to: '/dashboard', label: 'Executive Dashboard' },
    { to: '/approvals', label: 'Approval Center' },
    { to: '/users', label: 'Users' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/report-cards', label: 'Report Cards' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/reports', label: 'Reports' },
    { to: '/settings', label: 'Settings' },
  ],
  guidance: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/students', label: 'Student Lookup' },
    { to: '/announcements', label: 'Announcements' },
  ],
  registrar: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/enrollment', label: 'Enrollment Queue' },
    { to: '/students', label: 'Student Records' },
    { to: '/users', label: 'User Accounts' },
    { to: '/exports', label: 'Exports' },
  ],
  parent: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/grades', label: 'Child Grades' },
    { to: '/announcements', label: 'Announcements' },
  ],
}

function navClass({ isActive }) {
  return [
    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'border-l-4 border-knhs-purple bg-purple-50 text-knhs-purple'
      : 'text-gray-600 hover:bg-gray-50 hover:text-knhs-purple',
  ].join(' ')
}

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.student

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DepEdHeader compact />
      <div className="flex min-h-[calc(100vh-36px)]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-knhs-purple text-sm font-bold text-white">
              KN
            </div>
            <h1 className="mt-3 text-sm font-bold text-knhs-purple">{school.shortName}</h1>
            <p className="text-xs text-muted">{school.tagline}</p>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-gray-100 px-4 py-4">
            <Link to="/profile" className="mb-3 block rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-knhs-purple">
              ⚙️ Profile & Settings
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

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">Portal</p>
              <h2 className="text-lg font-semibold text-text">{school.name}</h2>
            </div>
            <div className="flex items-center gap-4">
              <NotificationPanel />
              <Link
                to="/"
                className="text-sm font-medium text-knhs-purple hover:text-knhs-purple-light"
              >
                Public site
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
