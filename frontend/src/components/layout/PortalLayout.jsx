import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../features/auth/AuthContext'
import DepEdHeader from './DepEdHeader'
import NotificationPanel from '../notifications/NotificationPanel'
import Breadcrumb from '../ui/Breadcrumb'
import QuickActions from '../ui/QuickActions'
import SearchBar from '../ui/SearchBar'
import { ROLE_LABELS, school } from '../../styles/design-tokens'

const NAV_BY_ROLE = {
  student: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/classes', label: 'My Classes', icon: '📚' },
      { to: '/schedule', label: 'Schedule', icon: '📅' },
    ]},
    { section: 'Academics', items: [
      { to: '/assignments', label: 'Assignments', icon: '📝' },
      { to: '/grades', label: 'Grades', icon: '📈' },
      { to: '/attendance', label: 'Attendance', icon: '📋' },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: '💬' },
      { to: '/announcements', label: 'Announcements', icon: '📢' },
    ]},
  ],
  teacher: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/classes', label: 'My Classes', icon: '📚' },
      { to: '/schedule', label: 'Schedule', icon: '📅' },
    ]},
    { section: 'Academics', items: [
      { to: '/assignments', label: 'Assignments', icon: '📝' },
      { to: '/grades', label: 'Grades', icon: '📈' },
      { to: '/attendance', label: 'Attendance', icon: '📋' },
      { to: '/report-cards', label: 'Report Cards', icon: '📄' },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: '💬' },
      { to: '/announcements', label: 'Announcements', icon: '📢' },
    ]},
  ],
  admin: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/analytics', label: 'Analytics', icon: '📈' },
    ]},
    { section: 'User Management', items: [
      { to: '/users', label: 'Users', icon: '👥' },
      { to: '/enrollment', label: 'Enrollment', icon: '📝' },
    ]},
    { section: 'Academic Management', items: [
      { to: '/classes', label: 'Classes', icon: '📚' },
      { to: '/report-cards', label: 'Report Cards', icon: '📄' },
    ]},
    { section: 'Content & Communication', items: [
      { to: '/content-editor', label: 'Content Editor', icon: '✏️' },
      { to: '/announcements', label: 'Announcements', icon: '📢' },
      { to: '/messages', label: 'Messages', icon: '💬' },
    ]},
    { section: 'System', items: [
      { to: '/reports', label: 'Reports', icon: '📊' },
      { to: '/settings', label: 'Settings', icon: '⚙️' },
    ]},
  ],
  principal: [
    { section: 'Executive', items: [
      { to: '/dashboard', label: 'Executive Dashboard', icon: '📊' },
      { to: '/analytics', label: 'Analytics', icon: '📈' },
      { to: '/approvals', label: 'Approval Center', icon: '✅' },
    ]},
    { section: 'Management', items: [
      { to: '/users', label: 'Users', icon: '👥' },
      { to: '/report-cards', label: 'Report Cards', icon: '📄' },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: '💬' },
      { to: '/announcements', label: 'Announcements', icon: '📢' },
    ]},
    { section: 'System', items: [
      { to: '/reports', label: 'Reports', icon: '📊' },
      { to: '/settings', label: 'Settings', icon: '⚙️' },
    ]},
  ],
  guidance: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/students', label: 'Student Lookup', icon: '🔍' },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: '💬' },
      { to: '/announcements', label: 'Announcements', icon: '📢' },
    ]},
  ],
  registrar: [
    { section: 'Main', items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/enrollment', label: 'Enrollment Queue', icon: '📝' },
    ]},
    { section: 'Records', items: [
      { to: '/students', label: 'Student Records', icon: '📋' },
      { to: '/users', label: 'User Accounts', icon: '👥' },
    ]},
    { section: 'Reports', items: [
      { to: '/reports', label: 'Reports & Exports', icon: '📊' },
    ]},
  ],
  parent: [
    { section: 'Main', items: [
      { to: '/parent-dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/grades', label: 'Child Grades', icon: '📈' },
    ]},
    { section: 'Communication', items: [
      { to: '/messages', label: 'Messages', icon: '💬' },
      { to: '/announcements', label: 'Announcements', icon: '📢' },
    ]},
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            {navItems.map((section) => (
              <div key={section.section} className="mb-4">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  {section.section}
                </h3>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
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
            <div className="flex items-center gap-3">
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
              <div className="flex-1">
                <Breadcrumb />
                <h2 className="mt-1 text-lg font-semibold text-text">{school.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar />
              <QuickActions />
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

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 overflow-y-auto bg-white">
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
                          <span className="mr-2">{item.icon}</span>
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
                  className="mb-3 block rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-knhs-purple"
                >
                  ⚙️ Profile & Settings
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
