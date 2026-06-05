/**
 * Mock data for testing Phase 2 features
 */

export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@test.com',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    display_name: 'Admin User',
  },
  principal: {
    id: '2',
    email: 'principal@test.com',
    role: 'principal',
    first_name: 'Principal',
    last_name: 'User',
    display_name: 'Principal User',
  },
  teacher: {
    id: '3',
    email: 'teacher@test.com',
    role: 'teacher',
    first_name: 'Teacher',
    last_name: 'User',
    display_name: 'Teacher User',
  },
  student: {
    id: '4',
    email: 'student@test.com',
    role: 'student',
    first_name: 'Student',
    last_name: 'User',
    display_name: 'Student User',
  },
}

export const mockQuarters = [
  {
    id: 'q1',
    name: 'Q1 2026-2027',
    number: 1,
    is_active: true,
    start_date: '2026-06-01',
    end_date: '2026-09-30',
  },
  {
    id: 'q2',
    name: 'Q2 2026-2027',
    number: 2,
    is_active: false,
    start_date: '2026-10-01',
    end_date: '2026-12-20',
  },
]

export const mockApprovalQueueItem = {
  class_subject_id: 'cs1',
  quarter_id: 'q1',
  classroom_name: 'Grade 7-A',
  subject_name: 'Mathematics',
  teacher_name: 'Teacher User',
  quarter_name: 'Q1 2026-2027',
  student_count: 35,
  latest_submitted_at: '2026-06-05T10:00:00Z',
  grades: [
    {
      id: 'g1',
      student_name: 'Juan Dela Cruz',
      student_lrn: '123456789',
      ww_score: 85.5,
      pt_score: 88.0,
      qa_score: 90.0,
      transmuted_grade: 87,
      is_passing: true,
      status: 'pending_approval',
    },
    {
      id: 'g2',
      student_name: 'Maria Santos',
      student_lrn: '987654321',
      ww_score: 92.0,
      pt_score: 95.5,
      qa_score: 89.0,
      transmuted_grade: 93,
      is_passing: true,
      status: 'pending_approval',
    },
  ],
}

export const mockLockedGrades = [
  {
    class_subject_id: 'cs2',
    quarter_id: 'q1',
    classroom_name: 'Grade 8-B',
    subject_name: 'English',
    teacher_name: 'Ms. Cruz',
    quarter_name: 'Q1 2026-2027',
    status: 'locked',
    student_count: 32,
    grades: [
      {
        id: 'g3',
        student_name: 'Pedro Garcia',
        student_lrn: '111222333',
        ww_score: 80.0,
        pt_score: 85.0,
        qa_score: 82.0,
        transmuted_grade: 83,
        is_passing: true,
        status: 'locked',
      },
    ],
  },
]

export const mockTransmutationTable = {
  table: [
    { initial_grade: 100.0, transmuted_grade: 100 },
    { initial_grade: 98.4, transmuted_grade: 99 },
    { initial_grade: 96.8, transmuted_grade: 98 },
    // ... more entries
    { initial_grade: 60.0, transmuted_grade: 75 },
  ],
  description: 'DepEd Transmutation Table',
  passing_grade: 75,
  grade_range: { min: 60, max: 100 },
}

export const mockNotifications = [
  {
    id: 'n1',
    notification_type: 'assignment',
    title: 'New assignment: Midterm Exam Review',
    body: 'A new assignment has been posted',
    link: '/assignments/a1',
    is_read: false,
    created_at: '2026-06-05T09:00:00Z',
  },
  {
    id: 'n2',
    notification_type: 'grade',
    title: 'Grades published',
    body: 'Your Mathematics grade for Q1 is now available',
    link: '/grades',
    is_read: false,
    created_at: '2026-06-05T08:00:00Z',
  },
]

export const mockApiResponses = {
  transmutationTable: {
    data: mockTransmutationTable,
  },
  approvalQueue: {
    data: [mockApprovalQueueItem],
  },
  lockedGrades: {
    data: mockLockedGrades,
  },
  quarters: {
    data: mockQuarters,
  },
  lockSuccess: {
    data: {
      message: 'Locked 35 grades successfully',
      count: 35,
    },
  },
  unlockSuccess: {
    data: {
      message: 'Grade unlocked successfully',
    },
  },
  publishSuccess: {
    data: {
      message: 'Published 35 grades successfully',
      count: 35,
    },
  },
  rejectSuccess: {
    data: {
      message: 'Returned 35 grades for revision',
      count: 35,
    },
  },
}
