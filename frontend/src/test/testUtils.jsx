import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../features/auth/AuthContext'
import { vi } from 'vitest'

// Create a custom render function that includes all providers
export function renderWithProviders(
  ui,
  {
    initialEntries = ['/'],
    user = null,
    ...renderOptions
  } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  // Mock AuthContext value
  const mockAuthValue = {
    user: user || null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthValue}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockAuthValue,
    queryClient,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Override the default render with our custom one
export { renderWithProviders as render }
