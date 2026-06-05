import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '../../test/testUtils'
import GradeStatusBadge from '../../components/ui/GradeStatusBadge'

describe('GradeStatusBadge', () => {
  it('renders draft status correctly', () => {
    render(<GradeStatusBadge status="draft" />)
    const badge = screen.getByText(/draft/i)
    expect(badge).toBeInTheDocument()
    expect(badge.parentElement).toHaveClass('bg-gray-100')
  })

  it('renders computed status correctly', () => {
    render(<GradeStatusBadge status="computed" />)
    const badge = screen.getByText(/computed/i)
    expect(badge).toBeInTheDocument()
    expect(badge.parentElement).toHaveClass('bg-blue-100')
  })

  it('renders pending_approval status correctly', () => {
    render(<GradeStatusBadge status="pending_approval" />)
    const badge = screen.getByText(/pending review/i)
    expect(badge).toBeInTheDocument()
    expect(badge.parentElement).toHaveClass('bg-amber-100')
  })

  it('renders published status correctly', () => {
    render(<GradeStatusBadge status="published" />)
    const badge = screen.getByText(/published/i)
    expect(badge).toBeInTheDocument()
    expect(badge.parentElement).toHaveClass('bg-green-100')
  })

  it('renders locked status correctly', () => {
    render(<GradeStatusBadge status="locked" />)
    const badge = screen.getByText(/locked/i)
    expect(badge).toBeInTheDocument()
    expect(badge.parentElement).toHaveClass('bg-purple-100')
    // Should include lock icon
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('renders unknown status with default styling', () => {
    render(<GradeStatusBadge status="unknown" />)
    const badge = screen.getByText(/draft/i)
    expect(badge).toBeInTheDocument()
    expect(badge.parentElement).toHaveClass('bg-gray-100')
  })

  it('applies correct text colors for each status', () => {
    const { rerender } = render(<GradeStatusBadge status="draft" />)
    expect(screen.getByText(/draft/i).parentElement).toHaveClass('text-gray-700')

    rerender(<GradeStatusBadge status="computed" />)
    expect(screen.getByText(/computed/i).parentElement).toHaveClass('text-blue-700')

    rerender(<GradeStatusBadge status="pending_approval" />)
    expect(screen.getByText(/pending review/i).parentElement).toHaveClass('text-amber-700')

    rerender(<GradeStatusBadge status="published" />)
    expect(screen.getByText(/published/i).parentElement).toHaveClass('text-green-700')

    rerender(<GradeStatusBadge status="locked" />)
    expect(screen.getByText(/locked/i).parentElement).toHaveClass('text-purple-700')
  })

  it('maintains consistent badge styling across all statuses', () => {
    const statuses = ['draft', 'computed', 'pending_approval', 'published', 'locked']
    
    statuses.forEach(status => {
      const { container, unmount } = render(<GradeStatusBadge status={status} />)
      const badge = container.firstChild
      
      // Check for common badge classes
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('items-center')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('px-3')
      expect(badge).toHaveClass('py-1')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('font-semibold')
      
      unmount()
    })
  })
})
