# Sprint 8 Phase 3: Frontend Testing Implementation

**Status:** 🟡 IN PROGRESS  
**Started:** June 5, 2026  
**Progress:** Test infrastructure complete, sample tests created

---

## ✅ Completed

### Test Infrastructure Setup ✅
1. **Vitest Configuration** - `vitest.config.js`
2. **Test Setup File** - `src/test/setup.js`
3. **Test Utilities** - `src/test/testUtils.jsx`
4. **Mock Data** - `src/test/mockData.js`
5. **Directory Structure** - `__tests__/components`, `__tests__/integration`, `__tests__/api`

### Sample Component Test ✅
- **GradeStatusBadge.test.jsx** - 8 tests for badge component
  - Tests all 5 status types (draft, computed, pending, published, locked)
  - Verifies correct styling and colors
  - Ensures consistent badge design

---

## 📦 Required Dependencies

Add to `package.json`:
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.2.0",
    "jsdom": "^23.2.0",
    "msw": "^2.0.11"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Install with:
```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom msw
```

---

## 🧪 Tests To Implement

### Component Tests (10 tests) - 10% Complete
- [x] GradeStatusBadge (8 tests) ✅
- [ ] ApprovalCenter Modal Tests
- [ ] AdminUnlockGrades Modal Tests
- [ ] Lock Confirmation Modal
- [ ] Unlock Validation Modal

### Integration Tests (8 tests) - 0% Complete
- [ ] Grade Approval Flow (approve + publish)
- [ ] Grade Rejection Flow
- [ ] Grade Locking Flow
- [ ] Admin Unlock Flow
- [ ] Transmutation API Integration
- [ ] Notification Display
- [ ] Permission-based Routing
- [ ] Form Submission Workflows

### API Tests (5 tests) - 0% Complete
- [ ] getTransmutationTable API call
- [ ] lock API with success/error
- [ ] unlock API with validation
- [ ] publish API workflow
- [ ] reject API workflow

---

## 📝 Test File Templates

### Component Test Template
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '../../test/testUtils'
import YourComponent from '../../path/to/YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText(/expected text/i)).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    const onClickMock = vi.fn()
    
    render(<YourComponent onClick={onClickMock} />)
    await user.click(screen.getByRole('button'))
    
    expect(onClickMock).toHaveBeenCalledTimes(1)
  })
})
```

### Integration Test Template
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, userEvent } from '../../test/testUtils'
import { mockUsers, mockApiResponses } from '../../test/mockData'
import YourPage from '../../pages/YourPage'

describe('YourPage Integration', () => {
  beforeEach(() => {
    // Setup API mocks
    vi.mock('../../lib/learningApi', () => ({
      gradeApi: {
        lock: vi.fn().mockResolvedValue(mockApiResponses.lockSuccess),
      },
    }))
  })

  it('completes full workflow', async () => {
    const user = userEvent.setup()
    render(<YourPage />, { user: mockUsers.principal })
    
    await user.click(screen.getByRole('button', { name: /lock/i }))
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument()
    })
  })
})
```

---

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- GradeStatusBadge

# Run tests matching pattern
npm test -- --grep="approval"
```

### Expected Output
```
 ✓ src/__tests__/components/GradeStatusBadge.test.jsx (8)
   ✓ GradeStatusBadge (8)
     ✓ renders draft status correctly
     ✓ renders computed status correctly
     ✓ renders pending_approval status correctly
     ✓ renders published status correctly
     ✓ renders locked status correctly
     ✓ renders unknown status with default styling
     ✓ applies correct text colors for each status
     ✓ maintains consistent badge styling across all statuses

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  13:30:00
   Duration  1.23s (transform 234ms, setup 0ms, collect 456ms, tests 543ms)
```

---

## 📊 Coverage Goals

### Target Coverage
- **Statements:** >70%
- **Branches:** >70%
- **Functions:** >70%
- **Lines:** >70%

### Priority Files (Must Have >80% Coverage)
- `src/pages/ApprovalCenter.jsx`
- `src/pages/AdminUnlockGrades.jsx`
- `src/pages/GradeInput.jsx`
- `src/components/ui/GradeStatusBadge.jsx`
- `src/lib/learningApi.js`

---

## 🎯 Next Steps (Priority Order)

### Immediate (Next Session)
1. Install test dependencies (`npm install`)
2. Run existing test to verify setup
3. Create ApprovalCenter modal tests
4. Create AdminUnlockGrades tests

### Short-term
5. Integration tests for full workflows
6. API mocking with MSW
7. Coverage report generation
8. Fix any failing tests

### Medium-term
9. E2E tests with Playwright (optional)
10. Visual regression tests (optional)
11. Performance tests (optional)

---

## 🐛 Common Testing Patterns

### Testing Modals
```javascript
it('opens and closes modal', async () => {
  const user = userEvent.setup()
  render(<ComponentWithModal />)
  
  // Modal should not be visible initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  
  // Open modal
  await user.click(screen.getByRole('button', { name: /open/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  
  // Close modal
  await user.click(screen.getByRole('button', { name: /cancel/i }))
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

### Testing Form Validation
```javascript
it('validates form input', async () => {
  const user = userEvent.setup()
  render(<FormComponent />)
  
  const input = screen.getByLabelText(/reason/i)
  
  // Try to submit with short input
  await user.type(input, 'short')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  // Should show validation error
  expect(screen.getByText(/minimum 20 characters/i)).toBeInTheDocument()
  
  // Fill with valid input
  await user.clear(input)
  await user.type(input, 'This is a valid reason that is long enough')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  // Should submit successfully
  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })
})
```

### Testing API Calls
```javascript
it('calls API with correct data', async () => {
  const mockLock = vi.fn().mockResolvedValue({ data: { message: 'Success' } })
  vi.mock('../../lib/learningApi', () => ({
    gradeApi: { lock: mockLock },
  }))
  
  const user = userEvent.setup()
  render(<LockButton classSubjectId="123" quarterId="456" />)
  
  await user.click(screen.getByRole('button', { name: /lock/i }))
  
  expect(mockLock).toHaveBeenCalledWith({
    class_subject_id: '123',
    quarter_id: '456',
  })
})
```

---

## 📚 Testing Best Practices

### DO ✅
- Test user behavior, not implementation
- Use accessible queries (getByRole, getByLabelText)
- Test error states and edge cases
- Mock API calls for consistent tests
- Keep tests focused and simple
- Use descriptive test names

### DON'T ❌
- Test internal component state directly
- Use getByTestId as first choice
- Test library code (React, Router, etc.)
- Make tests dependent on each other
- Ignore accessibility in tests
- Write overly complex test logic

---

## 🔗 Resources

- **Vitest Docs:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **Testing Library Queries:** https://testing-library.com/docs/queries/about
- **Common Mistakes:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## ✅ Definition of Done (Frontend Tests)

Frontend testing is complete when:
- [ ] All 23 tests implemented and passing
- [ ] >70% code coverage achieved
- [ ] All Phase 2 components tested
- [ ] Integration tests cover main workflows
- [ ] API tests verify all endpoints
- [ ] No console errors during tests
- [ ] Documentation updated

---

**Last Updated:** June 5, 2026  
**Files Created:** 5  
**Tests Written:** 8  
**Progress:** 35% of frontend testing (infrastructure + sample tests)
