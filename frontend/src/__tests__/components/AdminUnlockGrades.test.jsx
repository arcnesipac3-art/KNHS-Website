import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor, userEvent } from '../../test/testUtils'
import { mockUsers, mockLockedGrades } from '../../test/mockData'
import AdminUnlockGrades from '../../pages/AdminUnlockGrades'
import * as learningApi from '../../lib/learningApi'
import * as academicApi from '../../lib/academicApi'

vi.mock('../../lib/learningApi', () => ({
  gradeApi: {
    getAll: vi.fn(),
    unlock: vi.fn(),
  },
  notificationApi: {
    getUnreadCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
  },
}))

vi.mock('../../lib/academicApi', () => ({
  quarterApi: {
    getAll: vi.fn(),
  },
}))

describe('AdminUnlockGrades Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects non-admin users to dashboard', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      }
    })

    render(<AdminUnlockGrades />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('allows admin users to access page', async () => {
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true }]
    })
    
    learningApi.gradeApi.getAll.mockResolvedValue({
      data: []
    })

    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/admin grade unlock/i)).toBeInTheDocument()
    })
  })
})

describe('AdminUnlockGrades Unlock Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }]
    })
    
    learningApi.gradeApi.getAll.mockResolvedValue({
      data: mockLockedGrades[0].grades.map(g => ({
        ...g,
        class_subject_id: mockLockedGrades[0].class_subject_id,
        quarter_id: mockLockedGrades[0].quarter_id,
        classroom_name: mockLockedGrades[0].classroom_name,
        subject_name: mockLockedGrades[0].subject_name,
        teacher_name: mockLockedGrades[0].teacher_name,
        quarter_name: mockLockedGrades[0].quarter_name,
        status: 'locked',
      }))
    })
  })

  it('opens unlock modal when unlock button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })
  })

  it('closes unlock modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText(/emergency grade unlock/i)).not.toBeInTheDocument()
    })
  })

  it('requires unlock reason with minimum 20 characters', async () => {
    const user = userEvent.setup()
    window.alert = vi.fn()
    
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    // Try without reason
    const confirmButton = screen.getByRole('button', { name: /unlock grades/i })
    await user.click(confirmButton)

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('at least 20 characters')
    )

    // Try with short reason
    const textarea = screen.getByPlaceholderText(/must provide detailed/i)
    await user.type(textarea, 'Too short')
    await user.click(confirmButton)

    expect(window.alert).toHaveBeenCalledTimes(2)
  })

  it('requires double confirmation before unlocking', async () => {
    const user = userEvent.setup()
    window.alert = vi.fn()
    window.confirm = vi.fn(() => false)
    
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/must provide detailed/i)
    await user.type(textarea, 'Emergency: Computation error needs immediate correction')

    const confirmButton = screen.getByRole('button', { name: /unlock grades/i })
    await user.click(confirmButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('EMERGENCY ACTION')
    )
    
    // Should not call API if user cancels confirmation
    expect(learningApi.gradeApi.unlock).not.toHaveBeenCalled()
  })

  it('calls unlock API with valid reason and confirmation', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    learningApi.gradeApi.unlock.mockResolvedValue({
      data: { message: 'Grade unlocked successfully' }
    })

    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/must provide detailed/i)
    const reason = 'Emergency: Computation error in transmutation table needs immediate correction'
    await user.type(textarea, reason)

    const confirmButton = screen.getByRole('button', { name: /unlock grades/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(learningApi.gradeApi.unlock).toHaveBeenCalledWith({
        class_subject_id: mockLockedGrades[0].class_subject_id,
        quarter_id: mockLockedGrades[0].quarter_id,
        reason: reason,
      })
    })
  })

  it('displays success message after unlocking grades', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    learningApi.gradeApi.unlock.mockResolvedValue({
      data: { message: 'Grade unlocked successfully' }
    })

    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/must provide detailed/i)
    await user.type(textarea, 'Emergency: Computation error needs correction')

    const confirmButton = screen.getByRole('button', { name: /unlock grades/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/successfully unlocked/i)).toBeInTheDocument()
    })
  })

  it('displays error message if unlock fails', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    learningApi.gradeApi.unlock.mockRejectedValue({
      response: { data: { error: 'Unlock failed: grades already unlocked' } }
    })

    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/must provide detailed/i)
    await user.type(textarea, 'Emergency: Computation error needs correction')

    const confirmButton = screen.getByRole('button', { name: /unlock grades/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/unlock failed/i)).toBeInTheDocument()
    })
  })

  it('displays character count for unlock reason', async () => {
    const user = userEvent.setup()
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    })

    const unlockButton = screen.getByRole('button', { name: /🔓 emergency unlock/i })
    await user.click(unlockButton)

    await waitFor(() => {
      expect(screen.getByText(/emergency grade unlock/i)).toBeInTheDocument()
    })

    // Should show character count
    expect(screen.getByText(/0 \/ 20 minimum/i)).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText(/must provide detailed/i)
    await user.type(textarea, 'Emergency action')

    await waitFor(() => {
      expect(screen.getByText(/16 \/ 20 minimum/i)).toBeInTheDocument()
    })
  })
})
