# Sprint 8 Phase 3: Testing & Optimization

**Status:** 🟡 IN PROGRESS  
**Started:** June 5, 2026  
**Estimate:** 12-16 hours  
**Priority:** HIGH

---

## 🎯 Phase 3 Objectives

Transform Phase 2 features from "feature complete" to "production ready" through:
1. **Automated Testing** - Backend and frontend test suites
2. **Performance Optimization** - Pagination, caching, query optimization
3. **Security Hardening** - Rate limiting, CSRF, input sanitization
4. **UI Polish** - Loading states, error boundaries, accessibility
5. **Documentation** - API docs, deployment guides

---

## 📋 Task Breakdown

### Part 1: Backend Testing (4 hours)

#### 1.1 Permission Tests
- [ ] Test student cannot access teacher endpoints
- [ ] Test teacher cannot access principal endpoints
- [ ] Test principal cannot access admin endpoints
- [ ] Test anonymous users redirected
- [ ] Test JWT token expiration

**File:** `backend/apps/grading/tests/test_permissions.py`

#### 1.2 Workflow Tests
- [ ] Test complete grade lifecycle (draft → locked)
- [ ] Test state transitions are enforced
- [ ] Test cannot skip approval step
- [ ] Test locked grades cannot be edited
- [ ] Test unlock returns to computed state

**File:** `backend/apps/grading/tests/test_workflow.py`

#### 1.3 Calculation Tests
- [ ] Test DepEd grade formula (WW 30%, PT 50%, QA 20%)
- [ ] Test transmutation table accuracy
- [ ] Test all 28 transmutation boundaries
- [ ] Test edge cases (0, 100, 59.99, 60.00)
- [ ] Test rounding behavior

**File:** `backend/apps/grading/tests/test_calculations.py`

#### 1.4 API Endpoint Tests
- [ ] Test transmutation_table endpoint
- [ ] Test lock endpoint with permissions
- [ ] Test unlock endpoint (admin only)
- [ ] Test approval_queue grouping
- [ ] Test notification creation

**File:** `backend/apps/grading/tests/test_api.py`

---

### Part 2: Frontend Testing (4 hours)

#### 2.1 Component Tests
- [ ] Test GradeStatusBadge renders all statuses
- [ ] Test ApprovalCenter modals open/close
- [ ] Test AdminUnlockGrades validates reason length
- [ ] Test GradeInput calculates transmutation
- [ ] Test notification dropdown displays correctly

**Files:** `frontend/src/__tests__/components/*.test.jsx`

#### 2.2 Integration Tests
- [ ] Test grade approval flow end-to-end
- [ ] Test unlock flow with API calls
- [ ] Test notification delivery chain
- [ ] Test permission-based routing
- [ ] Test form submissions

**Files:** `frontend/src/__tests__/integration/*.test.jsx`

#### 2.3 API Integration Tests
- [ ] Test transmutation API call on mount
- [ ] Test lock API with success/error
- [ ] Test unlock API with validation
- [ ] Test approval queue API
- [ ] Test notification API

**Files:** `frontend/src/__tests__/api/*.test.js`

---

### Part 3: Performance Optimization (2 hours)

#### 3.1 Backend Optimization
- [ ] Add pagination to approval_queue (50 per page)
- [ ] Cache transmutation table (5-min cache)
- [ ] Add database indexes for common queries
- [ ] Optimize notification bulk creation
- [ ] Add select_related for grade queries

**Files to modify:**
- `backend/apps/grading/views.py`
- `backend/apps/grading/models.py`

#### 3.2 Frontend Optimization
- [ ] Add pagination to approval center list
- [ ] Memoize transmutation calculations
- [ ] Lazy load AdminUnlockGrades page
- [ ] Add request debouncing for API calls
- [ ] Implement virtual scrolling for long lists

**Files to modify:**
- `frontend/src/pages/ApprovalCenter.jsx`
- `frontend/src/pages/AdminUnlockGrades.jsx`
- `frontend/src/pages/GradeInput.jsx`

---

### Part 4: Security Hardening (2 hours)

#### 4.1 Rate Limiting
- [ ] Install django-ratelimit
- [ ] Add rate limits to lock endpoint (10/hour)
- [ ] Add rate limits to unlock endpoint (5/hour)
- [ ] Add rate limits to notification creation (100/min)
- [ ] Add rate limits to login (5/min)

**File:** `backend/config/settings.py`, `backend/apps/grading/views.py`

#### 4.2 CSRF Protection
- [ ] Verify CSRF tokens on all POST requests
- [ ] Update Axios to include CSRF token
- [ ] Test CSRF protection on all forms
- [ ] Add CSRF exemptions where needed

**Files:** `frontend/src/lib/api.js`, `backend/config/settings.py`

#### 4.3 Input Sanitization
- [ ] Sanitize unlock reason (prevent XSS)
- [ ] Sanitize reject reason
- [ ] Validate grade score ranges (0-100)
- [ ] Sanitize announcement content
- [ ] Add SQL injection tests

**Files:** Backend serializers and views

---

### Part 5: UI Polish (2 hours)

#### 5.1 Loading States
- [ ] Add skeleton loaders to ApprovalCenter
- [ ] Add skeleton loaders to AdminUnlockGrades
- [ ] Add loading indicators to all buttons
- [ ] Add progress bars for long operations
- [ ] Replace spinners with skeletons

**Files:** All frontend page components

#### 5.2 Error Boundaries
- [ ] Create ErrorBoundary component
- [ ] Wrap all major routes in ErrorBoundary
- [ ] Add fallback UI for errors
- [ ] Log errors to monitoring service
- [ ] Add retry mechanism

**File:** `frontend/src/components/ErrorBoundary.jsx`

#### 5.3 Accessibility
- [ ] Add ARIA labels to all buttons
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Add focus indicators
- [ ] Ensure color contrast meets WCAG AA

**Files:** All frontend components

#### 5.4 Mobile Responsiveness
- [ ] Test all modals on mobile
- [ ] Test tables scroll horizontally
- [ ] Test touch interactions
- [ ] Fix any layout issues
- [ ] Test on real devices

---

### Part 6: Documentation (2 hours)

#### 6.1 API Documentation
- [ ] Generate OpenAPI/Swagger docs
- [ ] Document all new endpoints
- [ ] Add request/response examples
- [ ] Document error codes
- [ ] Add authentication guide

**File:** `backend/config/urls.py` (swagger setup)

#### 6.2 Deployment Documentation
- [ ] Create production deployment guide
- [ ] Document environment variables
- [ ] Add troubleshooting section
- [ ] Create rollback procedures
- [ ] Add monitoring setup guide

**File:** `SPRINT8_PHASE3_DEPLOYMENT.md`

#### 6.3 User Documentation
- [ ] Create principal user guide
- [ ] Create admin user guide
- [ ] Create troubleshooting FAQ
- [ ] Add video tutorial scripts
- [ ] Create quick reference cards

**Files:** User guide documents

---

## 🔧 Technical Implementation Plan

### Testing Stack
```bash
# Backend
pytest
pytest-django
pytest-cov
factory-boy
faker

# Frontend
vitest
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
msw (API mocking)
```

### Performance Tools
```bash
# Backend
django-debug-toolbar
django-silk
locust (load testing)

# Frontend
lighthouse
webpack-bundle-analyzer
react-devtools-profiler
```

### Security Tools
```bash
# Backend
django-ratelimit
django-defender
bandit (security linter)

# Frontend
eslint-plugin-security
npm audit
```

---

## 📊 Success Metrics

### Testing Coverage
- **Backend:** > 80% code coverage
- **Frontend:** > 70% code coverage
- **Critical paths:** 100% coverage

### Performance
- **API Response:** < 200ms (95th percentile)
- **Page Load:** < 3s on 3G
- **Time to Interactive:** < 5s

### Security
- **No Critical Vulnerabilities:** 0
- **No High Vulnerabilities:** 0
- **Rate Limiting:** All endpoints protected

### Accessibility
- **Lighthouse Score:** > 90
- **WCAG Level:** AA compliance
- **Keyboard Navigation:** 100% functional

---

## 🚀 Implementation Order

### Day 1 (4-6 hours)
1. ✅ Setup testing infrastructure
2. ✅ Write backend permission tests
3. ✅ Write backend workflow tests
4. ✅ Write calculation tests

### Day 2 (4-6 hours)
5. ✅ Write frontend component tests
6. ✅ Write frontend integration tests
7. ✅ Implement performance optimizations

### Day 3 (4-4 hours)
8. ✅ Security hardening
9. ✅ UI polish
10. ✅ Final documentation

---

## 📝 Checklist Progress

### Backend Testing
- [ ] test_permissions.py (0/15 tests)
- [ ] test_workflow.py (0/12 tests)
- [ ] test_calculations.py (0/20 tests)
- [ ] test_api.py (0/15 tests)

### Frontend Testing
- [ ] Component tests (0/10 tests)
- [ ] Integration tests (0/8 tests)
- [ ] API tests (0/5 tests)

### Optimization
- [ ] Backend pagination
- [ ] Backend caching
- [ ] Frontend lazy loading
- [ ] Database indexes

### Security
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Input sanitization

### UI Polish
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Accessibility
- [ ] Mobile responsiveness

### Documentation
- [ ] API docs
- [ ] Deployment guide
- [ ] User guides

---

## 🎯 Definition of Done

Phase 3 is complete when:
- [x] All automated tests pass (>80% coverage)
- [x] Performance benchmarks met
- [x] Security scan shows no critical issues
- [x] Accessibility audit passes
- [x] All documentation complete
- [x] Code review approved
- [x] Ready for production deployment

---

## 🔗 Related Documents

- **Phase 1:** `SPRINT8_PHASE1_COMPLETE.md`
- **Phase 2:** `SPRINT8_PHASE2_COMPLETE.md`
- **Testing Guide:** `SPRINT8_PHASE2_TESTING_GUIDE.md`
- **Deployment:** `SPRINT8_PHASE2_DEPLOYMENT_CHECKLIST.md`

---

**Phase 3 Started:** June 5, 2026  
**Estimated Completion:** June 6-7, 2026  
**Next Phase:** Sprint 8 Phase 4 - Production Deployment
