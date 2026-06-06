import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor, userEvent } from '../../test/testUtils'
import { mockUsers, mockApprovalQueueItem, mockApiResponses } from '../../test/mockData'
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

describe('Grade Approval Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })
  })

  it('completes full approval workflow', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    
    learningApi.gradeApi.publish.mockResolvedValue(mockApiResponses.publishSuccess)
    learningApi.gradeApi.getApprovalQueue
      .mockResolvedValueOnce({ data: [mockApprovalQueueItem] })
      .mockResolvedValueOnce({ data: [] }) // Queue empty after approval

    render(<ApprovalCenter />, { user: mockUsers.principal })

    // Wait for approval queue to load
    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    // Click approve button
    const approveButton = screen.getByRole('button', { name: /✅ approve & publish/i })
    await user.click(approveButton)

    // Confirm approval
    expect(window.confirm).toHaveBeenCalled()

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/successfully approved/i)).toBeInTheDocument()
    })

    // Verify API was called correctly
    expect(learningApi.gradeApi.publish).toHaveBeenCalledWith({
      class_subject_id: mockApprovalQueueItem.class_subject_id,
      quarter_id: mockApprovalQueueItem.quarter_id,
      reason: expect.stringContaining('approved by principal'),
    })

    // Queue should refresh
    expect(learningApi.gradeApi.getApprovalQueue).toHaveBeenCalledTimes(2)
  })

  it('completes full rejection workflow', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    
    learningApi.gradeApi.reject.mockResolvedValue(mockApiResponses.rejectSuccess)
    learningApi.gradeApi.getApprovalQueue
      .mockResolvedValueOnce({ data: [mockApprovalQueueItem] })
      .mockResolvedValueOnce({ data: [] })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    // Open reject modal
    const rejectButton = screen.getByRole('button', { name: /❌ reject for revision/i })
    await user.click(rejectButton)

    await waitFor(() => {
      expect(screen.getByText(/reject grades for revision/i)).toBeInTheDocument()
    })

    // Enter reason
    const textarea = screen.getByPlaceholderText(/e\.g\., please review/i)
    const reason = 'Computation errors detected in final grade calculations'
    await user.type(textarea, reason)

    // Submit rejection
    const submitButton = screen.getByRole('button', { name: /reject grades/i })
    await user.click(submitButton)

    expect(window.confirm).toHaveBeenCalled()

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/returned for revision/i)).toBeInTheDocument()
    })

    // Verify API call
    expect(learningApi.gradeApi.reject).toHaveBeenCalledWith({
      class_subject_id: mockApprovalQueueItem.class_subject_id,
      quarter_id: mockApprovalQueueItem.quarter_id,
      reason: reason,
    })
  })

  it('completes full grade locking workflow', async () => {
    const user = userEvent.setup()
    
    learningApi.gradeApi.lock.mockResolvedValue(mockApiResponses.lockSuccess)
    learningApi.gradeApi.getApprovalQueue
      .mockResolvedValueOnce({ data: [mockApprovalQueueItem] })
      .mockResolvedValueOnce({ data: [] })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    // Open lock modal
    const lockButton = screen.getByRole('button', { name: /🔒 lock/i })
    await user.click(lockButton)

    await waitFor(() => {
      expect(screen.getByText(/lock grades permanently/i)).toBeInTheDocument()
    })

    // Warning should be visible
    expect(screen.getByText(/⚠️/)).toBeInTheDocument()
    expect(screen.getByText(/cannot be modified/i)).toBeInTheDocument()

    // Confirm lock
    const confirmButton = screen.getByRole('button', { name: /^lock grades$/i })
    await user.click(confirmButton)

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/successfully locked/i)).toBeInTheDocument()
    })

    // Verify API call
    expect(learningApi.gradeApi.lock).toHaveBeenCalledWith({
      class_subject_id: mockApprovalQueueItem.class_subject_id,
      quarter_id: mockApprovalQueueItem.quarter_id,
    })
  })
})

describe('Grade Approval Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true }]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })
  })

  it('handles approval API errors gracefully', async () => {
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }]
    })
    
    learningApi.gradeApi.getApprovalQueue.mockRejectedValue(new Error('Failed to load queue'))

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/failed to load queue/i)).toBeInTheDocument()
    })
  })

  it('handles already published error', async () => {
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1 2026-2027', is_active: true, number: 1 }]
    })
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({ data: [mockApprovalQueueItem] })
    learningApi.gradeApi.publish.mockRejectedValue({
      response: { data: { error: 'Grades already published' } }
    })

    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    
    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const approveButton = screen.getByRole('button', { name: /✅ approve & publish/i })
    await user.click(approveButton)

    await waitFor(() => {
      expect(screen.getByText(/grades already published/i)).toBeInTheDocument()
    })
  })

  it('handles network errors during approval', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => true)
    
    learningApi.gradeApi.publish.mockRejectedValue(new Error('Network error'))

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument()
    })

    const approveButton = screen.getByRole('button', { name: /✅ approve & publish/i })
    await user.click(approveButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to approve grades/i)).toBeInTheDocument()
    })
  })

  it('handles empty approval queue', async () => {
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({ data: [] })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
    })
  })

  it('handles quarter loading errors', async () => {
    academicApi.quarterApi.getAll.mockRejectedValue(new Error('Failed to load'))

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByText(/failed to load quarters/i)).toBeInTheDocument()
    })
  })
})

describe('Grade Approval Permission Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('principal can access approval center', async () => {
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1', is_active: true }]
    })
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({ data: [] })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /approval center/i })).toBeInTheDocument()
    })
  })

  it('admin can access approval center', async () => {
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1', is_active: true }]
    })
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({ data: [] })

    render(<ApprovalCenter />, { user: mockUsers.admin })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /approval center/i })).toBeInTheDocument()
    })
  })

  it('displays lock button for principals', async () => {
    academicApi.quarterApi.getAll.mockResolvedValue({
      data: [{ id: 'q1', name: 'Q1', is_active: true }]
    })
    learningApi.gradeApi.getApprovalQueue.mockResolvedValue({
      data: [mockApprovalQueueItem]
    })

    render(<ApprovalCenter />, { user: mockUsers.principal })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /🔒 lock/i })).toBeInTheDocument()
    })
  })
})
