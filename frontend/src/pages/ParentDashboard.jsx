import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    loadChildren()
    loadAnnouncements()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      loadChildGrades(selectedChild.student)
      loadChildAttendance(selectedChild.student)
    }
  }, [selectedChild])

  async function loadAnnouncements() {
    try {
      const response = await api.get('/announcements/?limit=5')
      setAnnouncements(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to load announcements:', error)
    }
  }

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
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow-lg">
          <p className="text-sm opacity-90">Welcome back,</p>
          <h1 className="text-3xl font-bold">{user?.display_name || user?.email}</h1>
          <p className="mt-1 text-blue-100">Parent Portal • Monitor your child's progress</p>
          <p className="mt-2 text-sm text-blue-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        {children.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Link to="/grades">
              <Button>View Grades</Button>
            </Link>
            <Link to="/attendance">
              <Button variant="secondary">Check Attendance</Button>
            </Link>
            <Link to="/announcements">
              <Button variant="secondary">Announcements</Button>
            </Link>
            <Link to="/messages">
              <Button variant="secondary">Contact School</Button>
            </Link>
          </div>
        )}

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
                <Card className="mb-6">
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

                {/* Recent Announcements */}
                <Card>
                  <h2 className="mb-4 text-lg font-semibold text-text">Recent Announcements</h2>
                  {announcements?.length > 0 ? (
                    <div className="space-y-3">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                        >
                          <h5 className="text-sm font-medium text-text">{announcement.title}</h5>
                          <p className="mt-1 text-xs text-muted line-clamp-2">{announcement.content || announcement.body}</p>
                          <p className="mt-1 text-xs text-muted">
                            {new Date(announcement.created_at || announcement.published_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      <Link
                        to="/announcements"
                        className="block text-center text-sm text-blue-600 hover:underline"
                      >
                        View all →
                      </Link>
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted">No recent announcements</p>
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
