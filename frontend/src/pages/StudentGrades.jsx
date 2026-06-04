import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import { gradeApi } from '../lib/learningApi'
import { quarterApi } from '../lib/academicApi'

export default function StudentGrades() {
  const { user } = useAuth()
  const [quarters, setQuarters] = useState([])
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isStudent = user?.role === 'student'

  // Load quarters on mount
  useEffect(() => {
    async function loadQuarters() {
      try {
        const { data } = await quarterApi.getAll()
        setQuarters(data)
        
        // Auto-select current quarter
        const current = data.find((q) => q.is_active)
        if (current) {
          setSelectedQuarter(current.id)
        } else if (data.length > 0) {
          setSelectedQuarter(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load quarters:', err)
        setError('Failed to load quarters')
      }
    }
    loadQuarters()
  }, [])

  // Load grades when quarter changes
  useEffect(() => {
    async function loadGrades() {
      if (!selectedQuarter) {
        setGrades([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data } = await gradeApi.getAll({ quarter: selectedQuarter })
        
        // Filter only published grades for students
        const publishedGrades = data.filter((g) => g.status === 'published')
        setGrades(publishedGrades)
      } catch (err) {
        console.error('Failed to load grades:', err)
        setError('Failed to load your grades')
      } finally {
        setLoading(false)
      }
    }

    loadGrades()
  }, [selectedQuarter])

  // Calculate statistics
  const stats = {
    total: grades.length,
    passed: grades.filter((g) => g.transmuted_grade >= 75).length,
    failed: grades.filter((g) => g.transmuted_grade < 75).length,
    average: grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.transmuted_grade, 0) / grades.length).toFixed(2)
      : 0,
  }

  const selectedQuarterData = quarters.find((q) => q.id === selectedQuarter)

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">My Grades</h1>
          <p className="mt-2 text-muted">View your published grades and academic performance</p>
        </div>

        {/* Quarter Selector */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="quarter" className="block text-sm font-medium text-text">
                Select Quarter
              </label>
              <select
                id="quarter"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="mt-2 block w-64 rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                {quarters.length === 0 && <option value="">No quarters available</option>}
                {quarters.map((quarter) => (
                  <option key={quarter.id} value={quarter.id}>
                    {quarter.name}
                    {quarter.is_active && ' (Current)'}
                  </option>
                ))}
              </select>
            </div>

            {selectedQuarterData && grades.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted">Quarter Average</p>
                <p className={`text-3xl font-bold ${stats.average >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.average}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Statistics Cards */}
        {grades.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-text">{stats.total}</p>
                  <p className="text-sm text-muted">Total Subjects</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-text">{stats.passed}</p>
                  <p className="text-sm text-muted">Passed (75+)</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-text">{stats.failed}</p>
                  <p className="text-sm text-muted">Below 75</p>
                </div>
                <div className="rounded-lg bg-red-100 p-3">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-text">{stats.average}</p>
                  <p className="text-sm text-muted">General Average</p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3">
                  <svg className="h-6 w-6 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 font-medium text-red-900">{error}</p>
            </div>
          </Card>
        )}

        {/* Grades Table */}
        <Card title="Subject Grades" subtitle={selectedQuarterData ? selectedQuarterData.name : 'Select a quarter'}>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                <p className="mt-4 text-muted">Loading grades...</p>
              </div>
            </div>
          ) : grades.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">No Grades Available</h3>
              <p className="mt-2 text-sm text-muted">
                {selectedQuarter
                  ? 'Your teachers have not published grades for this quarter yet.'
                  : 'Please select a quarter to view your grades.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-semibold text-text">Subject</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-text">WW (30%)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-text">PT (50%)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-text">QA (20%)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-text">Grade</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-text">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grades.map((grade) => {
                    const isPassed = grade.transmuted_grade >= 75

                    return (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="font-medium text-text">{grade.subject_name || 'Unknown Subject'}</p>
                          <p className="text-xs text-muted">{grade.teacher_name || 'Teacher'}</p>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-muted">
                          {grade.ww ? grade.ww.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-muted">
                          {grade.pt ? grade.pt.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-muted">
                          {grade.qa ? grade.qa.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-base font-bold ${
                              isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {grade.transmuted_grade}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              isPassed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isPassed ? 'Passed' : 'Needs Improvement'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Legend */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <p className="mb-3 text-sm font-medium text-text">Grading Components:</p>
                <div className="grid gap-4 text-sm text-muted md:grid-cols-3">
                  <div>
                    <p className="font-medium text-text">WW - Written Work (30%)</p>
                    <p className="text-xs">Quizzes, assignments, seatwork</p>
                  </div>
                  <div>
                    <p className="font-medium text-text">PT - Performance Task (50%)</p>
                    <p className="text-xs">Projects, presentations, practical work</p>
                  </div>
                  <div>
                    <p className="font-medium text-text">QA - Quarterly Assessment (20%)</p>
                    <p className="text-xs">Periodical examination</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Note:</strong> Transmuted grades are computed using the DepEd transmutation table. A grade of 75 or above is passing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  )
}
