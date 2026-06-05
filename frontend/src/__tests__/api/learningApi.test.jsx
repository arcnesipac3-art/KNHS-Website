import { describe, it, expect } from 'vitest'
import { gradeApi } from '../../lib/learningApi'

describe('Grade API Structure', () => {
  it('has getTransmutationTable method', () => {
    expect(typeof gradeApi.getTransmutationTable).toBe('function')
  })

  it('has lock method', () => {
    expect(typeof gradeApi.lock).toBe('function')
  })

  it('has unlock method', () => {
    expect(typeof gradeApi.unlock).toBe('function')
  })

  it('has publish method', () => {
    expect(typeof gradeApi.publish).toBe('function')
  })

  it('has reject method', () => {
    expect(typeof gradeApi.reject).toBe('function')
  })

  it('has getApprovalQueue method', () => {
    expect(typeof gradeApi.getApprovalQueue).toBe('function')
  })

  it('has getAll method', () => {
    expect(typeof gradeApi.getAll).toBe('function')
  })
})
