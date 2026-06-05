import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor, userEvent } from '../../test/testUtils'
import { mockUsers, mockApprovalQueueItem } from '../../test/mockData'
import ApprovalCenter from '../../pages/ApprovalCenter'
import * as learningApi from '../../lib/learningApi'
import * as academicApi from '../../lib/academicApi'

// Mock API modules
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

describe('ApprovalCenter Lock Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default API responses
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [
        { id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }
      ]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })
  })

  it('opens lock confirmation modal when lock button is clicked', async () => {
    const user = userEvent.setup()
    render(<ApprovalCenter />, { user: mockUsers.principal })

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    // Find and click lock button
    const lockButton = screen.getByRole('button', { name: /lock grades/i })
    await user.click(lockButton)

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/lock grades permanently/i)).toBeInTheDocument()
    })
  })

  it('closes lock modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    // Open modal
    const lockButton = screen.getByRole('button', { name: /lock grades/i })
    await user.click(lockButton)

    await waitFor(() => {
      expect(screen.getByText(/lock grades permanently/i)).toBeInTheDocument()
    })

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/lock grades permanently/i)).not.toBeInTheDocument()
    })
  })

  it('calls lock API when confirm is clicked', async () => {
    const user = userEvent.setup()
    learningApi.gradeApi.lock.mockResolvedValue({
      data: { message: 'Locked 35 grades successfully' }
    })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    // Open modal and confirm
    const lockButton = screen.getByRole('button', { name: /lock grades/i })
    await user.click(lockButton)

    await waitFor(() => {
      expect(screen.getByText(/lock grades permanently/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /^lock grades$/i })
    await user.click(confirmButton)

    // API should be called
    await waitFor(() => {
      expect(learningApi.gradeApi.lock).toHaveBeenCalledWith({
        class_subject_id: mockApprovalQueueItem.class_subject_id,
        quarter_id: mockApprovalQueueItem.quarter_id,
      })
    })
  })

  it('displays success message after locking grades', async () => {
    const user = userEvent.setup()
    learningApi.gradeApi.lock.mockResolvedValue({
      data: { message: 'Locked 35 grades successfully' }
    })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const lockButton = screen.getByRole('button', { name: /lock grades/i })
    await user.click(lockButton)

    await waitFor(() => {
      expect(screen.getByText(/lock grades permanently/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /^lock grades$/i })
    await user.click(confirmButton)

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText(/successfully locked/i)).toBeInTheDocument()
    })
  })

  it('displays error message if lock fails', async () => {
    const user = userEvent.setup()
    learningApi.gradeApi.lock.mockRejectedValue({
      response: { data: { error: 'Lock failed' } }
    })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const lockButton = screen.getByRole('button', { name: /lock grades/i })
    await user.click(lockButton)

    await waitFor(() => {
      expect(screen.getByText(/lock grades permanently/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /^lock grades$/i })
    await user.click(confirmButton)

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/lock failed/i)).toBeInTheDocument()
    })
  })
})

describe('ApprovalCenter Reject Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })
  })

  it('opens reject modal when reject button is clicked', async () => {
    const user = userEvent.setup()
    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const rejectButton = screen.getByRole('button', { name: /reject/i })
    await user.click(rejectButton)

    await waitFor(() => {
      expect(screen.getByText(/return for revision/i)).toBeInTheDocument()
    })
  })

  it('requires reason before allowing reject submission', async () => {
    const user = userEvent.setup()
    window.alert = vi.fn()
    
    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const rejectButton = screen.getByRole('button', { name: /reject/i })
    await user.click(rejectButton)

    await waitFor(() => {
      expect(screen.getByText(/return for revision/i)).toBeInTheDocument()
    })

    // Try to submit without reason
    const submitButton = screen.getByRole('button', { name: /return to teacher/i })
    await user.click(submitButton)

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('provide a reason')
    )
  })

  it('validates minimum reason length', async () => {
    const user = userEvent.setup()
    window.alert = vi.fn()
    
    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const rejectButton = screen.getByRole('button', { name: /reject/i })
    await user.click(rejectButton)

    await waitFor(() => {
      expect(screen.getByText(/return for revision/i)).toBeInTheDocument()
    })

    // Enter short reason
    const textarea = screen.getByPlaceholderText(/explain what needs/i)
    await user.type(textarea, 'Short')

    const submitButton = screen.getByRole('button', { name: /return to teacher/i })
    await user.click(submitButton)

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('at least 10 characters')
    )
  })

  it('calls reject API with valid reason', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    learningApi.gradeApi.reject.mockResolvedValue({
      data: { message: 'Grades returned for revision' }
    })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const rejectButton = screen.getByRole('button', { name: /reject/i })
    await user.click(rejectButton)

    await waitFor(() => {
      expect(screen.getByText(/return for revision/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/explain what needs/i)
    await user.type(textarea, 'Please review computation errors')

    const submitButton = screen.getByRole('button', { name: /return to teacher/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(learningApi.gradeApi.reject).toHaveBeenCalledWith({
        class_subject_id: mockApprovalQueueItem.class_subject_id,
        quarter_id: mockApprovalQueueItem.quarter_id,
        reason: 'Please review computation errors',
      })
    })
  })
})
