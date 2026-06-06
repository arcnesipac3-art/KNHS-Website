import { Link, useLocation } from 'react-router-dom'

export default function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const getBreadcrumbLabel = (pathname) => {
    const labels = {
      dashboard: 'Dashboard',
      classes: 'Classes',
      assignments: 'Assignments',
      attendance: 'Attendance',
      schedule: 'Schedule',
      grades: 'Grades',
      messages: 'Messages',
      announcements: 'Announcements',
      users: 'Users',
      enrollment: 'Enrollment',
      'report-cards': 'Report Cards',
      reports: 'Reports',
      analytics: 'Analytics',
      'content-editor': 'Content Editor',
      settings: 'Settings',
      approvals: 'Approval Center',
      students: 'Students',
      'parent-dashboard': 'Parent Dashboard',
      profile: 'Profile',
    }
    
    return labels[pathname] || pathname
  }

  if (pathnames.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted">
      <Link to="/" className="hover:text-knhs-purple">
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        
        return (
          <div key={name} className="flex items-center space-x-2">
            <span className="text-gray-400">/</span>
            {isLast ? (
              <span className="font-medium text-text">
                {getBreadcrumbLabel(name)}
              </span>
            ) : (
              <Link to={routeTo} className="hover:text-knhs-purple">
                {getBreadcrumbLabel(name)}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
