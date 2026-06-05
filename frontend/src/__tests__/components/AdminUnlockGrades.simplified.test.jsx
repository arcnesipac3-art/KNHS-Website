import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '../../test/testUtils'
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

describe('AdminUnlockGrades Page', () => {
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

  it('renders admin unlock page for admin users', async () => {
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByTestId('portal-layout')).toBeInTheDocument()
    })
  })

  it('loads locked grades from API', async () => {
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(learningApi.gradeApi.getAll).toHaveBeenCalledWith({
        quarter: 'q1',
        status: 'locked,published'
      })
    }, { timeout: 3000 })
  })

  it('displays locked grade information', async () => {
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/english/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/grade 8-b/i)).toBeInTheDocument()
  })

  it('shows empty state when no locked grades', async () => {
    learningApi.gradeApi.getAll.mockResolvedValue({ data: [] })

    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/no locked grades/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles API errors', async () => {
    learningApi.gradeApi.getAll.mockRejectedValue(new Error('Failed to load'))

    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe('AdminUnlockGrades Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1', is_active: true }]
    })
    
    learningApi.gradeApi.getAll.mockResolvedValue({ data: [] })
  })

  it('allows admin users to access the page', async () => {
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByText(/admin/i)).toBeInTheDocument()
    })
  })

  it('title mentions admin and unlock', async () => {
    render(<AdminUnlockGrades />, { user: mockUsers.admin })

    await waitFor(() => {
      const headings = screen.getAllByRole('heading')
      const hasAdminUnlock = headings.some(h => 
        h.textContent.match(/admin/i) && h.textContent.match(/unlock/i)
      )
      expect(hasAdminUnlock).toBe(true)
    })
  })
})
