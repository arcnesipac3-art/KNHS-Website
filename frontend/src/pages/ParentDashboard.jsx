import { useState, useEffect } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function ParentDashboard() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState(null)
  const [childGrades, setChildGrades] = useState([])
  const [childAttendance, setChildAttendance] = useState([])
  const [showLinkForm, setShowLinkForm] = useState(false)

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      loadChildGrades(selectedChild.student)
      loadChildAttendance(selectedChild.student)
    }
  }, [selectedChild])

  async function loadChildren() {
    try {
      const response = await api.get('/parent-student-links/my_children/')
      setChildren(response.data)
      if (response.data.length > 0) {
        setSelectedChild(response.data[0])
      }
    } catch (error) {
      console.error('Failed to load children:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadChildGrades(studentId) {
    try {
      const response = await api.get(`/grades/?student=${studentId}`)
      setChildGrades(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load child grades:', error)
    }
  }

  async function loadChildAttendance(studentId) {
    try {
      const response = await api.get(`/attendance/?student=${studentId}`)
      setChildAttendance(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load child attendance:', error)
    }
  }

  async function handleLinkRequest(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const studentId = formData.get('student_id')
    const relationship = formData.get('relationship')
    const relationshipOther = formData.get('relationship_other')

    try {
      await api.post('/parent-student-links/request_link/', {
        student_id: studentId,
        relationship,
        relationship_other: relationshipOther,
      })
      setShowLinkForm(false)
      alert('Link request submitted. Waiting for approval.')
      loadChildren()
    } catch (error) {
      console.error('Failed to submit link request:', error)
      alert('Failed to submit link request. Please check the student ID.')
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-knhs-purple border-t-transparent"></div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text">Parent Dashboard</h1>
          <p className="mt-2 text-muted">Monitor your child's academic progress</p>
        </div>

        {children.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <h2 className="mb-4 text-xl font-semibold text-text">No Children Linked</h2>
              <p className="mb-6 text-muted">
                You haven't linked any student accounts yet. Request to link with your child's account.
              </p>
              <Button onClick={() => setShowLinkForm(true)}>Link Child Account</Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Child Selection */}
            <Card className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-text">Select Child</h2>
              <div className="flex gap-4">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`rounded-lg border px-4 py-3 transition-colors ${
                      selectedChild?.id === child.id
                        ? 'border-knhs-purple bg-purple-50 text-knhs-purple'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">{child.student_name}</p>
                    <p className="text-sm text-muted">Grade {child.student_grade_level}</p>
                  </button>
                ))}
                <Button onClick={() => setShowLinkForm(true)} variant="secondary">
                  + Link Another Child
                </Button>
              </div>
            </Card>

            {selectedChild && (
              <>
                {/* Child Grades */}
                <Card className="mb-6">
                  <h2 className="mb-4 text-lg font-semibold text-text">Recent Grades</h2>
                  {childGrades.length === 0 ? (
                    <p className="text-muted">No grades available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">Subject</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">Quarter</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">WW</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">PT</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">QA</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">Transmuted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {childGrades.slice(0, 10).map(grade => (
                            <tr key={grade.id} className="border-b border-gray-100">
                              <td className="px-4 py-3 text-sm text-text">{grade.subject_name || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-text">{grade.quarter || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-text">{grade.ww || '-'}</td>
                              <td className="px-4 py-3 text-sm text-text">{grade.pt || '-'}</td>
                              <td className="px-4 py-3 text-sm text-text">{grade.qa || '-'}</td>
                              <td className="px-4 py-3 text-sm font-medium text-text">{grade.transmuted || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Child Attendance */}
                <Card>
                  <h2 className="mb-4 text-lg font-semibold text-text">Attendance Summary</h2>
                  {childAttendance.length === 0 ? (
                    <p className="text-muted">No attendance records available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">Date</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-text">Subject</th>
                          </tr>
                        </thead>
                        <tbody>
                          {childAttendance.slice(0, 10).map(record => (
                            <tr key={record.id} className="border-b border-gray-100">
                              <td className="px-4 py-3 text-sm text-text">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                                    record.status === 'present'
                                      ? 'bg-green-100 text-green-800'
                                      : record.status === 'absent'
                                      ? 'bg-red-100 text-red-800'
                                      : record.status === 'late'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-text">{record.subject_name || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            )}
          </>
        )}

        {showLinkForm && (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-text">Link Child Account</h2>
            <form onSubmit={handleLinkRequest} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Student ID (UUID)</label>
                <input
                  type="text"
                  name="student_id"
                  required
                  placeholder="Enter your child's student ID"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Relationship</label>
                <select
                  name="relationship"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                >
                  <option value="">Select relationship</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Relationship (if other)</label>
                <input
                  type="text"
                  name="relationship_other"
                  placeholder="Specify relationship"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowLinkForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </PortalLayout>
  )
}
