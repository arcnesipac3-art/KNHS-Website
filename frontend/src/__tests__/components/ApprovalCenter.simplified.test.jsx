import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '../../test/testUtils'
import { mockUsers, mockApprovalQueueItem } from '../../test/mockData'
import ApprovalCenter from '../../pages/ApprovalCenter'
import * as learningApi from '../../lib/learningApi'
import * as academicApi from '../../lib/academicApi'

vi.mock('../../lib/learningApi', () => ({
  gradeApi: {
    getApprovalQueue: vi.fn(),
    publish: vi.fn(),
    reject: vi.fn(),
    lock: vi.fn(),
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

describe('ApprovalCenter Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })
  })

  it('renders approval center page for principal', async () => {
    render(<ApprovalCenter />, { user: mockUsers.principal })

    // Page should render
    await waitFor(() => {
      expect(screen.getByTestId('portal-layout')).toBeInTheDocument()
    })
  })

  it('loads and displays approval queue data', async () => {
    render(<ApprovalCenter />, { user: mockUsers.principal })

    // Wait for API calls
    await waitFor(() => {
      expect(academicApi.quarterApi.getAll).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(learningApi.gradeApi.getApprovalQueue).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('displays subject and classroom information when data loads', async () => {
    render(<ApprovalCenter />, { user: mockUsers.principal })

    // Should show subject name
    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should show classroom name
    expect(screen.getByText(/grade 7-a/i)).toBeInTheDocument()
  })

  it('shows empty state when no grades pending', async () => {
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({ data: [] })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/no grades pending/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('admin user can access approval center', async () => {
    render(<ApprovalCenter />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByTestId('portal-layout')).toBeInTheDocument()
    })
  })
})

describe('ApprovalCenter API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true }]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })
  })

  it('calls API with correct quarter parameter', async () => {
    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(learningApi.gradeApi.getApprovalQueue).toHaveBeenCalledWith({
        quarter: 'q1'
      })
    }, { timeout: 3000 })
  })

  it('handles API errors gracefully', async () => {
    learningApi.gradeApi.getApprovalQueue.mockRejectedValue(
      new Error('Network error')
    )

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
