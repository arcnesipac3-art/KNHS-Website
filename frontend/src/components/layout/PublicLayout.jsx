import { Link, Outlet } from 'react-router-dom'
import DepEdHeader from './DepEdHeader'
import { school } from '../../styles/design-tokens'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DepEdHeader />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-knhs-purple text-lg font-bold text-white">
              KN
            </div>
            <div>
              <h1 className="text-lg font-bold text-knhs-purple">{school.shortName}</h1>
              <p className="text-xs text-muted">{school.name}</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 md:flex">
            <Link to="/" className="hover:text-knhs-purple">Home</Link>
            <Link to="/about" className="hover:text-knhs-purple">About</Link>
            <Link to="/academics" className="hover:text-knhs-purple">Academics</Link>
            <Link to="/news" className="hover:text-knhs-purple">News & Events</Link>
            <Link to="/contact" className="hover:text-knhs-purple">Contact</Link>
            <Link
              to="/login"
              className="rounded-lg bg-knhs-purple px-4 py-2 text-white hover:bg-knhs-purple-light"
            >
              Portal Login
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="mt-auto border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted">
          <p className="font-medium text-text">{school.name}</p>
          <p>{school.location}</p>
          <p className="mt-2">© {new Date().getFullYear()} {school.shortName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
