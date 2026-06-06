import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

export default function SearchBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(query)}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-knhs-purple hover:text-knhs-purple"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <span className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-xs text-muted sm:inline">
          ⌘K
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <form onSubmit={handleSearch} className="p-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students, classes, announcements..."
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <p>Press <kbd className="rounded border px-1">Enter</kbd> to search</p>
                <p>Press <kbd className="rounded border px-1">Escape</kbd> to close</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
