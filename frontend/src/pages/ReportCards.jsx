import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { classroomApi, academicYearApi } from '../lib/academicApi'
import { gradeApi } from '../lib/learningApi'
import api from '../lib/api'

export default function ReportCards() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [classrooms, setClassrooms] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(null) // ID of student being generated
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [reportType, setReportType] = useState('sf9') // sf9, sf5, sf10
  const [reportCards, setReportCards] = useState([])

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'principal'

  // Access control
  useEffect(() => {
    if (!isTeacherOrAdmin) {
      navigate('/dashboard')
    }
  }, [user, isTeacherOrAdmin, navigate])

  // Load classrooms and academic years
  useEffect(() => {
    async function loadData() {
      try {
        const [classroomsRes, yearsRes] = await Promise.all([
          classroomApi.getAll(),
          academicYearApi.getAll()
        ])
        setClassrooms(Array.isArray(classroomsRes.data) ? classroomsRes.data : (classroomsRes.data?.results ?? []))
        const yearsList = Array.isArray(yearsRes.data) ? yearsRes.data : (yearsRes.data?.results ?? [])
        setAcademicYears(yearsList)

        // Auto-select current academic year
        const currentYear = yearsList.find(y => y.is_current)
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load classrooms and academic years')
      }
    }

    if (isTeacherOrAdmin) {
      loadData()
    }
  }, [isTeacherOrAdmin])

  // Load report cards when report type changes
  useEffect(() => {
    async function loadReportCards() {
      if (reportType === 'sf9') {
        setReportCards([])
        return
      }

      try {
        const response = await api.get('/report-cards/')
        setReportCards(response.data.results || response.data)
      } catch (err) {
        console.error('Failed to load report cards:', err)
      }
    }

    loadReportCards()
  }, [reportType])

  // Load students when classroom changes
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClassroom || !selectedAcademicYear) {
        setStudents([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const { data } = await classroomApi.getEnrollments(selectedClassroom, 'active')
        setStudents(data)
      } catch (err) {
        console.error('Failed to load students:', err)
        setError('Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    if (isTeacherOrAdmin) {
      loadStudents()
    }
  }, [selectedClassroom, selectedAcademicYear, isTeacherOrAdmin])

  async function handleGenerateSF9(studentId) {
    setGenerating(studentId)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await gradeApi.downloadSF9PDF({
        student: studentId,
        academic_year: selectedAcademicYear
      })

      // Create download link
      const student = students.find(s => s.student_id === studentId)
      const filename = `SF9_${student?.student_lrn || studentId}_${selectedAcademicYear}.pdf`
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setSuccessMessage(`SF9 report card generated for ${student?.student_name || 'student'}`)
    } catch (err) {
      console.error('Failed to generate SF9:', err)
      setError(err.response?.data?.error || 'Failed to generate SF9 report card')
    } finally {
      setGenerating(null)
    }
  }

  async function handleGenerateClassBatch() {
    if (!selectedClassroom || !selectedAcademicYear) {
      setError('Please select both classroom and academic year')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Generate SF9 for each student
      for (const student of students) {
        await handleGenerateSF9(student.student_id)
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setSuccessMessage(`Generated ${students.length} SF9 report cards successfully`)
    } catch (err) {
      console.error('Failed to generate batch SF9:', err)
      setError('Failed to generate batch SF9 report cards')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateSF5(studentId, quarterId) {
    setGenerating(studentId)
    setError(null)
    setSuccessMessage(null)

    try {
      const selectedYearData = academicYears.find(y => y.id === selectedAcademicYear)
      const schoolYear = selectedYearData?.label || '2024-2025'

      await api.post('/report-cards/generate/', {
        student_id: studentId,
        report_type: 'sf5',
        school_year: schoolYear,
        quarter_id: quarterId,
      })

      setSuccessMessage('SF5 report card generated successfully')
      loadReportCards()
    } catch (err) {
      console.error('Failed to generate SF5:', err)
      setError(err.response?.data?.error || 'Failed to generate SF5 report card')
    } finally {
      setGenerating(null)
    }
  }

  async function handleGenerateSF10(studentId) {
    setGenerating(studentId)
    setError(null)
    setSuccessMessage(null)

    try {
      const selectedYearData = academicYears.find(y => y.id === selectedAcademicYear)
      const schoolYear = selectedYearData?.label || '2024-2025'

      await api.post('/report-cards/generate/', {
        student_id: studentId,
        report_type: 'sf10',
        school_year: schoolYear,
      })

      setSuccessMessage('SF10 permanent record generated successfully')
      loadReportCards()
    } catch (err) {
      console.error('Failed to generate SF10:', err)
      setError(err.response?.data?.error || 'Failed to generate SF10 permanent record')
    } finally {
      setGenerating(null)
    }
  }

  async function handleSignReportCard(reportCardId) {
    try {
      await api.post(`/report-cards/${reportCardId}/sign/`)
      setSuccessMessage('Report card signed successfully')
      loadReportCards()
    } catch (err) {
      console.error('Failed to sign report card:', err)
      setError(err.response?.data?.error || 'Failed to sign report card')
    }
  }

  async function handleMarkPrinted(reportCardId) {
    try {
      await api.post(`/report-cards/${reportCardId}/mark_printed/`)
      setSuccessMessage('Report card marked as printed')
      loadReportCards()
    } catch (err) {
      console.error('Failed to mark report card as printed:', err)
      setError('Failed to mark report card as printed')
    }
  }

  function loadReportCards() {
    if (reportType === 'sf9') {
      setReportCards([])
      return
    }

    api.get('/report-cards/')
      .then(response => {
        setReportCards(response.data.results || response.data)
      })
      .catch(err => {
        console.error('Failed to load report cards:', err)
      })
  }

  const selectedClassroomData = classrooms.find(c => c.id === selectedClassroom)
  const selectedYearData = academicYears.find(y => y.id === selectedAcademicYear)

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Report Cards</h1>
            <p className="mt-2 text-muted">Generate official DepEd report cards (SF5, SF9, SF10) for students</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        {/* Report Type Tabs */}
        <Card>
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setReportType('sf9')}
              className={`px-4 py-2 font-medium ${
                reportType === 'sf9'
                  ? 'border-b-2 border-knhs-purple text-knhs-purple'
                  : 'text-muted hover:text-text'
              }`}
            >
              SF9 (Form 138)
            </button>
            <button
              onClick={() => setReportType('sf5')}
              className={`px-4 py-2 font-medium ${
                reportType === 'sf5'
                  ? 'border-b-2 border-knhs-purple text-knhs-purple'
                  : 'text-muted hover:text-text'
              }`}
            >
              SF5 (Report Card)
            </button>
            <button
              onClick={() => setReportType('sf10')}
              className={`px-4 py-2 font-medium ${
                reportType === 'sf10'
                  ? 'border-b-2 border-knhs-purple text-knhs-purple'
                  : 'text-muted hover:text-text'
              }`}
            >
              SF10 (Form 137)
            </button>
          </div>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <Card className="border-l-4 border-green-500 bg-green-50">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-green-900">{successMessage}</p>
              </div>
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
              <div className="flex-1">
                <p className="font-medium text-red-900">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Classroom Selector */}
            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-text">
                Select Class
              </label>
              <select
                id="classroom"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                <option value="">Choose a class...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name} - Grade {classroom.grade_level} {classroom.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Selector */}
            <div>
              <label htmlFor="academic_year" className="block text-sm font-medium text-text">
                Academic Year
              </label>
              <select
                id="academic_year"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
              >
                <option value="">Choose academic year...</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.label} {year.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Info Banner */}
          {selectedClassroomData && selectedYearData && (
            <div className="mt-6 rounded-lg bg-gradient-to-r from-knhs-purple to-purple-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedClassroomData.name}</h3>
                  <p className="text-sm text-purple-200">
                    {selectedYearData.label} • {students.length} students
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateClassBatch}
                  disabled={loading || students.length === 0}
                >
                  {loading ? 'Generating...' : 'Generate All SF9'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Students Table */}
        {selectedClassroom && selectedAcademicYear && (
          <Card title="Students" subtitle="Generate SF9 report card for each student">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-knhs-purple"></div>
                  <p className="mt-4 text-muted">Loading students...</p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-text">No Students Found</h3>
                <p className="mt-2 text-sm text-muted">This class has no active students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-semibold text-text">#</th>
                      <th className="px-4 py-3 text-sm font-semibold text-text">Student Name</th>
                      <th className="px-4 py-3 text-sm font-semibold text-text">LRN</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-text">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-muted">{index + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-knhs-purple">
                              {student.student_name ? student.student_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <p className="font-medium text-text">{student.student_name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted">
                          {student.student_lrn || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateSF9(student.student_id)}
                            disabled={generating === student.student_id}
                          >
                            {generating === student.student_id ? (
                              <>
                                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate SF9
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Help Text */}
        {!selectedClassroom && reportType === 'sf9' && (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-8 w-8 text-knhs-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-text">Generate SF9 Report Cards</h3>
              <p className="mt-2 text-sm text-muted">
                Select a class and academic year to generate official DepEd Form 138 (SF9) report cards.
              </p>
              <div className="mt-6 text-left">
                <p className="text-sm font-medium text-text">SF9 Report Card includes:</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Student information and LRN
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All quarterly grades with final averages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Attendance summary per quarter
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    General average and remarks (PASSED/FAILED)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Official DepEd format ready for printing
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* SF5/SF10 Report Cards List */}
        {reportType !== 'sf9' && (
          <Card title={`${reportType === 'sf5' ? 'SF5' : 'SF10'} Report Cards`} subtitle="Generated report cards">
            {reportCards.length === 0 ? (
              <p className="py-8 text-center text-muted">No report cards generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Student</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">School Year</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Quarter</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Generated</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCards.map(card => (
                      <tr key={card.id} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-sm text-text">{card.student_name}</td>
                        <td className="px-4 py-3 text-sm text-text">{card.report_type_display}</td>
                        <td className="px-4 py-3 text-sm text-text">{card.school_year}</td>
                        <td className="px-4 py-3 text-sm text-text">{card.quarter_name || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              card.status === 'generated'
                                ? 'bg-blue-100 text-blue-800'
                                : card.status === 'signed'
                                ? 'bg-green-100 text-green-800'
                                : card.status === 'printed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {card.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {card.generated_at ? new Date(card.generated_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            {card.status === 'generated' && (user.role === 'admin' || user.role === 'principal') && (
                              <Button size="sm" variant="secondary" onClick={() => handleSignReportCard(card.id)}>
                                Sign
                              </Button>
                            )}
                            {card.status === 'signed' && (
                              <Button size="sm" variant="secondary" onClick={() => handleMarkPrinted(card.id)}>
                                Mark Printed
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </PortalLayout>
  )
}
