import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { gradeApi } from '../lib/learningApi'
import { classroomApi, quarterApi, classSubjectApi } from '../lib/academicApi'

export default function GradeInput() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [classrooms, setClassrooms] = useState([])
  const [quarters, setQuarters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [grades, setGrades] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [transmutationTable, setTransmutationTable] = useState([])

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  // Access control
  useEffect(() => {
    if (!isTeacher) {
      navigate('/dashboard')
    }
  }, [user, isTeacher, navigate])

  // Load transmutation table on mount
  useEffect(() => {
    async function loadTransmutationTable() {
      try {
        const { data } = await gradeApi.getTransmutationTable()
        setTransmutationTable(data.table)
      } catch (err) {
        console.error('Failed to load transmutation table:', err)
        // Fallback to empty array - transmuteGrade will handle it
      }
    }
    if (isTeacher) {
      loadTransmutationTable()
    }
  }, [isTeacher])

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [classroomsRes, quartersRes] = await Promise.all([
          classroomApi.getAll(),
          quarterApi.getAll(),
        ])
        setClassrooms(classroomsRes.data)
        setQuarters(quartersRes.data)
      } catch (err) {
        console.error('Failed to load initial data:', err)
        setError('Failed to load classes and quarters')
      }
    }
    if (isTeacher) {
      loadInitialData()
    }
  }, [isTeacher])

  // Load subjects when classroom changes
  useEffect(() => {
    async function loadSubjects() {
      if (!selectedClassroom) {
        setSubjects([])
        return
      }

      try {
        const { data } = await classSubjectApi.getAll({ classroom: selectedClassroom })
        setSubjects(data)
      } catch (err) {
        console.error('Failed to load subjects:', err)
        setError('Failed to load subjects for this class')
      }
    }
    loadSubjects()
  }, [selectedClassroom])

  // Load enrollments and grades when all filters are selected
  useEffect(() => {
    async function loadGradesData() {
      if (!selectedClassroom || !selectedQuarter || !selectedSubject) {
        setEnrollments([])
        setGrades({})
        return
      }

      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      try {
        // Load enrollments
        const { data: enrollmentsData } = await classroomApi.getEnrollments(selectedClassroom, 'active')
        setEnrollments(enrollmentsData)

        // Load existing grades
        const { data: gradesData } = await gradeApi.getAll({
          class_subject: selectedSubject,
          quarter: selectedQuarter,
        })

        // Map grades to enrollment IDs
        const gradesMap = {}
        gradesData.forEach((grade) => {
          gradesMap[grade.enrollment_id] = {
            id: grade.id,
            ww: grade.ww || '',
            pt: grade.pt || '',
            qa: grade.qa || '',
            transmuted: grade.transmuted_grade || '',
            status: grade.status || 'draft',
          }
        })

        // Initialize empty grades for students without records
        enrollmentsData.forEach((enrollment) => {
          if (!gradesMap[enrollment.id]) {
            gradesMap[enrollment.id] = {
              id: null,
              ww: '',
              pt: '',
              qa: '',
              transmuted: '',
              status: 'draft',
            }
          }
        })

        setGrades(gradesMap)
      } catch (err) {
        console.error('Failed to load grades:', err)
        setError('Failed to load grade data')
      } finally {
        setLoading(false)
      }
    }

    loadGradesData()
  }, [selectedClassroom, selectedQuarter, selectedSubject])

  function handleGradeChange(enrollmentId, component, value) {
    // Allow only numbers and decimals
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return
    }

    setGrades((prev) => {
      const updated = {
        ...prev,
        [enrollmentId]: {
          ...prev[enrollmentId],
          [component]: value,
        },
      }

      // Auto-calculate transmuted grade if all components are filled
      const grade = updated[enrollmentId]
      if (grade.ww && grade.pt && grade.qa) {
        const initial = calculateInitialGrade(
          parseFloat(grade.ww),
          parseFloat(grade.pt),
          parseFloat(grade.qa)
        )
        grade.transmuted = transmuteGrade(initial)
      } else {
        grade.transmuted = ''
      }

      return updated
    })
  }

  function calculateInitialGrade(ww, pt, qa) {
    // DepEd Formula: Initial Grade = (WW × 0.30) + (PT × 0.50) + (QA × 0.20)
    return (ww * 0.30) + (pt * 0.50) + (qa * 0.20)
  }

  function transmuteGrade(initialGrade) {
    // Use API-provided transmutation table
    if (!transmutationTable || transmutationTable.length === 0) {
      // Fallback to hardcoded table if API fails
      if (initialGrade >= 100.00) return 100
      if (initialGrade >= 98.40) return 99
      if (initialGrade >= 96.80) return 98
      if (initialGrade >= 95.20) return 97
      if (initialGrade >= 93.60) return 96
      if (initialGrade >= 92.00) return 95
      if (initialGrade >= 90.40) return 94
      if (initialGrade >= 88.80) return 93
      if (initialGrade >= 87.20) return 92
      if (initialGrade >= 85.60) return 91
      if (initialGrade >= 84.00) return 90
      if (initialGrade >= 82.40) return 89
      if (initialGrade >= 80.80) return 88
      if (initialGrade >= 79.20) return 87
      if (initialGrade >= 77.60) return 86
      if (initialGrade >= 76.00) return 85
      if (initialGrade >= 74.40) return 84
      if (initialGrade >= 72.80) return 83
      if (initialGrade >= 71.20) return 82
      if (initialGrade >= 69.60) return 81
      if (initialGrade >= 68.00) return 80
      if (initialGrade >= 66.40) return 79
      if (initialGrade >= 64.80) return 78
      if (initialGrade >= 63.20) return 77
      if (initialGrade >= 61.60) return 76
      if (initialGrade >= 60.00) return 75
      return 60
    }

    // Find the appropriate transmuted grade from the table
    // Table is sorted descending by initial_grade
    for (const entry of transmutationTable) {
      if (initialGrade >= entry.initial_grade) {
        return entry.transmuted_grade
      }
    }
    
    // Below minimum grade
    return 60
  }

  async function handleSave() {
    if (!selectedSubject || !selectedQuarter) {
      setError('Please select a subject and quarter')
      return
    }

    // Validate grades
    const gradeRecords = []
    for (const enrollment of enrollments) {
      const grade = grades[enrollment.id]
      if (grade && (grade.ww || grade.pt || grade.qa)) {
        // At least one component is filled
        if (!grade.ww || !grade.pt || !grade.qa) {
          setError(`Please complete all components for ${enrollment.student_name}`)
          return
        }

        // Validate range (0-100)
        const ww = parseFloat(grade.ww)
        const pt = parseFloat(grade.pt)
        const qa = parseFloat(grade.qa)

        if (ww < 0 || ww > 100 || pt < 0 || pt > 100 || qa < 0 || qa > 100) {
          setError(`Grades must be between 0 and 100 for ${enrollment.student_name}`)
          return
        }

        gradeRecords.push({
          enrollment_id: enrollment.id,
          ww,
          pt,
          qa,
        })
      }
    }

    if (gradeRecords.length === 0) {
      setError('Please enter grades for at least one student')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await gradeApi.batchInput({
        class_subject_id: selectedSubject,
        quarter_id: selectedQuarter,
        grades: gradeRecords,
      })

      setSuccessMessage(`Grades saved successfully for ${gradeRecords.length} student(s)`)
      
      // Reload grades to get IDs and computed values from backend
      const { data: gradesData } = await gradeApi.getAll({
        class_subject: selectedSubject,
        quarter: selectedQuarter,
      })

      const gradesMap = {}
      gradesData.forEach((grade) => {
        gradesMap[grade.enrollment_id] = {
          id: grade.id,
          ww: grade.ww || '',
          pt: grade.pt || '',
          qa: grade.qa || '',
          transmuted: grade.transmuted_grade || '',
          status: grade.status || 'draft',
        }
      })
      setGrades(gradesMap)

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to save grades:', err)
      setError(err.response?.data?.error || 'Failed to save grades. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitForApproval() {
    if (!selectedSubject || !selectedQuarter) {
      return
    }

    // Check if all enrolled students have grades
    const studentsWithoutGrades = enrollments.filter((enrollment) => {
      const grade = grades[enrollment.id]
      return !grade || !grade.ww || !grade.pt || !grade.qa
    })

    if (studentsWithoutGrades.length > 0) {
      setError(`${studentsWithoutGrades.length} student(s) do not have complete grades. Please fill all grades before submitting.`)
      return
    }

    if (!window.confirm('Are you sure you want to submit these grades for principal approval? You will not be able to edit them until they are reviewed.')) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await gradeApi.submitForApproval({
        class_subject_id: selectedSubject,
        quarter_id: selectedQuarter,
        reason: 'Submitting grades for principal review and approval'
      })

      setSuccessMessage('Grades submitted successfully! The principal will review and approve them before students can view them.')
      
      // Reload to update status
      const { data: gradesData } = await gradeApi.getAll({
        class_subject: selectedSubject,
        quarter: selectedQuarter,
      })

      const gradesMap = {}
      gradesData.forEach((grade) => {
        gradesMap[grade.enrollment_id] = {
          id: grade.id,
          ww: grade.ww || '',
          pt: grade.pt || '',
          qa: grade.qa || '',
          transmuted: grade.transmuted_grade || '',
          status: grade.status || 'draft',
        }
      })
      setGrades(gradesMap)

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to submit grades:', err)
      setError(err.response?.data?.error || 'Failed to submit grades. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedClassroomData = classrooms.find((c) => c.id === selectedClassroom)
  const selectedQuarterData = quarters.find((q) => q.id === selectedQuarter)
  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject)

  const allGradesComplete = enrollments.length > 0 && enrollments.every((enrollment) => {
    const grade = grades[enrollment.id]
    return grade && grade.ww && grade.pt && grade.qa
  })

  const isPendingApproval = Object.values(grades).some((g) => g.status === 'pending_approval')
  const isPublished = Object.values(grades).some((g) => g.status === 'published')
  const isLocked = Object.values(grades).some((g) => g.status === 'locked')

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Grade Input</h1>
            <p className="mt-2 text-muted">Enter WW/PT/QA grades for your students</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="border-l-4 border-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-green-900">{successMessage}</p>
              <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Classroom Selector */}
            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-text">
                Select Class
              </label>
              <select
                id="classroom"
                value={selectedClassroom}
                onChange={(e) => {
                  setSelectedClassroom(e.target.value)
                  setSelectedSubject('')
                }}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                <option value="">Choose a class...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - Grade {classroom.grade_level}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter Selector */}
            <div>
              <label htmlFor="quarter" className="block text-sm font-medium text-text">
                Select Quarter
              </label>
              <select
                id="quarter"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                <option value="">Choose a quarter...</option>
                {quarters.map((quarter) => (
                  <option key={quarter.id} value={quarter.id}>
                    {quarter.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text">
                Select Subject
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                disabled={!selectedClassroom}
              >
                <option value="">Choose a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Info Banner */}
          {selectedClassroomData && selectedQuarterData && selectedSubjectData && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-knhs-purple to-purple-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedClassroomData.name} - {selectedSubjectData.subject_name}
                  </h3>
                  <p className="text-sm text-purple-200">
                    {selectedQuarterData.name} • {enrollments.length} students
                    {isPendingApproval && <span className="ml-2 rounded bg-amber-500 bg-opacity-90 px-2 py-0.5 text-xs font-semibold">Pending Approval</span>}
                    {isPublished && !isLocked && <span className="ml-2 rounded bg-green-500 bg-opacity-90 px-2 py-0.5 text-xs font-semibold">Published</span>}
                    {isLocked && <span className="ml-2 rounded bg-purple-900 bg-opacity-60 px-2 py-0.5 text-xs font-semibold">🔒 Locked</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Grade Input Table */}
        {selectedClassroom && selectedQuarter && selectedSubject && (
          <Card title="Student Grades" subtitle="Enter WW (30%), PT (50%), QA (20%) components">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                  <p className="mt-4 text-muted">Loading grades...</p>
                </div>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-text">No Students Enrolled</h3>
                <p className="mt-2 text-sm text-muted">This class has no active students yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left">
                        <th className="px-4 py-3 text-sm font-semibold text-text">#</th>
                        <th className="px-4 py-3 text-sm font-semibold text-text">Student Name</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-text">WW (30%)</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-text">PT (50%)</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-text">QA (20%)</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-text">Transmuted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {enrollments.map((enrollment, index) => {
                        const grade = grades[enrollment.id] || {}
                        const isDisabled = grade.status === 'pending_approval' || grade.status === 'published' || grade.status === 'locked'

                        return (
                          <tr key={enrollment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm text-muted">{index + 1}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-knhs-purple">
                                  {enrollment.student_name ? enrollment.student_name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-text">{enrollment.student_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted">{enrollment.student_lrn || 'No LRN'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                value={grade.ww || ''}
                                onChange={(e) => handleGradeChange(enrollment.id, 'ww', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                disabled={isDisabled}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="0-100"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                value={grade.pt || ''}
                                onChange={(e) => handleGradeChange(enrollment.id, 'pt', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                disabled={isDisabled}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="0-100"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="number"
                                value={grade.qa || ''}
                                onChange={(e) => handleGradeChange(enrollment.id, 'qa', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                disabled={isDisabled}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="0-100"
                              />
                            </td>
                            <td className="px-4 py-4 text-center">
                              {grade.transmuted ? (
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                  grade.transmuted >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {grade.transmuted}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                {enrollments.length > 0 && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                    <div className="text-sm text-muted">
                      <p>
                        <span className="font-medium text-text">{enrollments.length}</span> students •{' '}
                        <span className={`font-medium ${allGradesComplete ? 'text-green-600' : 'text-amber-600'}`}>
                          {Object.values(grades).filter((g) => g.ww && g.pt && g.qa).length} complete
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" onClick={handleSave} disabled={saving || isPendingApproval || isPublished || isLocked}>
                        {saving ? 'Saving...' : 'Save Draft'}
                      </Button>
                      <Button onClick={handleSubmitForApproval} disabled={saving || !allGradesComplete || isPendingApproval || isPublished || isLocked}>
                        {isPendingApproval ? 'Pending Approval' : isPublished ? 'Published' : isLocked ? 'Locked' : 'Submit for Approval'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Help Text */}
        {!selectedClassroom || !selectedQuarter || !selectedSubject ? (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">Select Class, Quarter, and Subject</h3>
              <p className="mt-2 text-sm text-muted">
                Choose a class, quarter, and subject from the dropdowns above to start entering grades.
              </p>
              <div className="mt-6 text-left">
                <p className="text-sm font-medium text-text">DepEd Grading System:</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li>• <strong>WW (Written Work):</strong> 30% - Quizzes, assignments, seatwork</li>
                  <li>• <strong>PT (Performance Task):</strong> 50% - Projects, presentations, practical work</li>
                  <li>• <strong>QA (Quarterly Assessment):</strong> 20% - Periodical exam</li>
                  <li>• <strong>Transmuted Grade:</strong> Auto-calculated using DepEd transmutation table</li>
                  <li>• <strong>Passing Grade:</strong> 75 and above</li>
                </ul>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </PortalLayout>
  )
}
