import React from 'react'
import { expect, afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Make React global for JSX
global.React = React

// Mock react-router-dom navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock PortalLayout to simplify component tests
vi.mock('../components/layout/PortalLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => React.createElement(
    'div', 
    { 'data-testid': 'portal-layout' },
    [
      React.createElement('h1', { key: 'title' }, title),
      children
    ]
  ),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock alert and confirm (can be overridden in individual tests)
window.alert = vi.fn()
window.confirm = vi.fn(() => true)

global.expect = expect
