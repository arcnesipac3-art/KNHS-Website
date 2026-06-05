import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { conductRatingApi } from '../lib/learningApi'
import { classroomApi, quarterApi } from '../lib/academicApi'

const CORE_VALUES = [
  {
    id: 'maka_diyos',
    label: 'Maka-Diyos',
    behaviors: [
      "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others",
      "Shows adherence to ethical principles by upholding truth"
    ]
  },
  {
    id: 'makatao',
    label: 'Makatao',
    behaviors: [
      "Is sensitive to individual, social, and cultural differences",
      "Demonstrates contributions toward solidarity"
    ]
  },
  {
    id: 'makakalikasan',
    label: 'Makakalikasan',
    behaviors: [
      "Cares for the environment and utilizes resources wisely, judiciously, and economically"
    ]
  },
  {
    id: 'makabansa',
    label: 'Makabansa',
    behaviors: [
      "Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen",
      "Demonstrates appropriate behavior in carrying out activities in the school, community, and country"
    ]
  }
]

const RATINGS = [
  { value: 'AO', label: 'AO' },
  { value: 'SO', label: 'SO' },
  { value: 'RO', label: 'RO' },
  { value: 'NO', label: 'NO' }
]

export default function ConductRatings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [classrooms, setClassrooms] = useState([])
  const [quarters, setQuarters] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  // Access control
  useEffect(() => {
    if (!isTeacher) {
      navigate('/dashboard')
    }
  }, [user, isTeacher, navigate])

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

  // Load enrollments and existing ratings
  useEffect(() => {
    async function loadData() {
      if (!selectedClassroom || !selectedQuarter) {
        setEnrollments([])
        setRatings({})
        return
      }

      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      try {
        const [enrollmentsRes, ratingsRes] = await Promise.all([
          classroomApi.getEnrollments(selectedClassroom, 'active'),
          conductRatingApi.getAll({
            classroom: selectedClassroom,
            quarter: selectedQuarter,
          })
        ])

        setEnrollments(enrollmentsRes.data)

        // Map existing ratings to [student_id][behavior]
        const ratingsMap = {}
        ratingsRes.data.forEach((r) => {
          const studentId = r.class_enrollment.student_id || r.class_enrollment
          if (!ratingsMap[studentId]) ratingsMap[studentId] = {}
          ratingsMap[studentId][r.behavior] = r.rating
        })

        setRatings(ratingsMap)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load enrollment or rating data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedClassroom, selectedQuarter])

  const handleRatingChange = (studentId, behavior, rating) => {
    setRatings(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [behavior]: rating
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const payload = {
        classroom_id: selectedClassroom,
        quarter_id: selectedQuarter,
        ratings: []
      }

      Object.entries(ratings).forEach(([studentId, behaviorRatings]) => {
        Object.entries(behaviorRatings).forEach(([behavior, rating]) => {
          if (rating) {
            // Find core value for this behavior
            const coreValue = CORE_VALUES.find(cv => cv.behaviors.includes(behavior))?.id
            if (coreValue) {
              payload.ratings.push({
                student_id: studentId,
                core_value: coreValue,
                behavior,
                rating
              })
            }
          }
        })
      })

      await conductRatingApi.batchInput(payload)
      setSuccessMessage('Conduct ratings saved successfully!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to save ratings:', err)
      setError('Failed to save ratings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Conduct Ratings</h1>
          <p className="text-muted">Rate students based on DepEd Core Values</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Select Class</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 focus:border-knhs-purple focus:outline-none"
              >
                <option value="">-- Choose Class --</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade_level} - {c.section})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Select Quarter</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 focus:border-knhs-purple focus:outline-none"
              >
                <option value="">-- Choose Quarter --</option>
                {quarters.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="bg-purple-50 p-4">
          <h3 className="mb-2 font-semibold text-knhs-purple">Rating Scale</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>AO</strong> - Always Observed</div>
            <div><strong>SO</strong> - Sometimes Observed</div>
            <div><strong>RO</strong> - Rarely Observed</div>
            <div><strong>NO</strong> - Not Observed</div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 rounded-lg bg-green-50 p-4 text-green-600">
          {successMessage}
        </div>
      )}

      {selectedClassroom && selectedQuarter && (
        <div className="mt-8 space-y-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-knhs-purple"></div>
            </div>
          ) : enrollments.length === 0 ? (
            <Card className="py-12 text-center">
              <p className="text-muted">No students enrolled in this class.</p>
            </Card>
          ) : (
            <>
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3">
                    <h3 className="font-bold text-text">
                      {enrollment.student_name}
                      <span className="ml-2 text-sm font-normal text-muted">LRN: {enrollment.student_lrn}</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {CORE_VALUES.map((cv) => (
                        <div key={cv.id}>
                          <h4 className="mb-3 font-semibold text-knhs-purple">{cv.label}</h4>
                          <div className="space-y-4">
                            {cv.behaviors.map((behavior) => (
                              <div key={behavior} className="flex flex-col gap-4 border-b border-gray-50 pb-4 last:border-0 sm:flex-row sm:items-center">
                                <p className="flex-1 text-sm text-text">{behavior}</p>
                                <div className="flex gap-2">
                                  {RATINGS.map((r) => (
                                    <button
                                      key={r.value}
                                      onClick={() => handleRatingChange(enrollment.student_id, behavior, r.value)}
                                      className={`h-10 w-12 rounded-lg text-sm font-bold transition-colors ${
                                        ratings[enrollment.student_id]?.[behavior] === r.value
                                          ? 'bg-knhs-purple text-white'
                                          : 'bg-gray-100 text-muted hover:bg-purple-100'
                                      }`}
                                    >
                                      {r.value}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}

              <div className="sticky bottom-6 mt-8 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={saving}
                  className="shadow-lg"
                >
                  {saving ? 'Saving...' : 'Save All Conduct Ratings'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </PortalLayout>
  )
}
