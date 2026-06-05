import React from 'react'

// Simple mock for PortalLayout - just renders children
export default function PortalLayout({ children }) {
  return (
    <div data-testid="portal-layout">
      {children}
    </div>
  )
}
