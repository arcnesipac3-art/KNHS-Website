import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { assignmentApi, submissionApi } from '../lib/learningApi'
import { classSubjectApi } from '../lib/academicApi'

const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-700',
  published: 'bg-blue-100 text-blue-700',
  graded:    'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
  late:      'bg-red-100 text-red-700',
  overdue:   'bg-red-100 text-red-700',
}

export default function AssignmentList() {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isStudent = user?.role === 'student'

  const [assignments, setAssignments] = useState([])
  const [submittedIds, setSubmittedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [classSubjects, setClassSubjects] = useState([])
  const [subjectFilter, setSubjectFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [assignRes, csRes] = await Promise.allSettled([
      assignmentApi.getAll(),
      classSubjectApi.getAll(),
    ])

    let assignArr = []
    if (assignRes.status === 'fulfilled') {
      const d = assignRes.value.data
      assignArr = Array.isArray(d) ? d : (d?.results ?? [])
      setAssignments(assignArr)
    }

    if (csRes.status === 'fulfilled') {
      const d = csRes.value.data
      setClassSubjects(Array.isArray(d) ? d : (d?.results ?? []))
    }

    // Students: also load submissions to mark what's done
    if (isStudent) {
      const subRes = await submissionApi.getAll().catch(() => ({ data: [] }))
      const subs = Array.isArray(subRes.data) ? subRes.data : (subRes.data?.results ?? [])
      setSubmittedIds(new Set(subs.map(s => s.assignment)))
    }

    setLoading(false)
  }

  // Compute display status for each assignment
  function getDisplayStatus(a) {
    if (isStudent) {
      if (submittedIds.has(a.id)) return 'submitted'
      if (a.is_overdue) return 'overdue'
      return a.status
    }
    return a.status
  }

  const filtered = assignments.filter(a => {
    const ds = getDisplayStatus(a)
    const statusMatch = statusFilter === 'all' || ds === statusFilter
    const subjectMatch = subjectFilter === 'all' || a.class_subject === subjectFilter
    return statusMatch && subjectMatch
  })

  const sorted = [...filtered].sort((a, b) => {
    // Overdue first, then by due date
    const oa = a.is_overdue ? -1 : 1
    const ob = b.is_overdue ? -1 : 1
    if (oa !== ob) return oa - ob
    return new Date(a.due_date) - new Date(b.due_date)
  })

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !submittedIds.has(a.id) && !a.is_overdue && a.status === 'published').length,
    overdue: assignments.filter(a => a.is_overdue && !submittedIds.has(a.id)).length,
    submitted: submittedIds.size,
    draft: assignments.filter(a => a.status === 'draft').length,
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Assignments</h1>
            <p className="mt-2 text-muted">
              {isTeacher ? 'Manage and track all your class assignments' : 'Your current and past assignments'}
            </p>
          </div>
          {isTeacher && (
            <Link to="/assignments/create">
              <Button>+ Create Assignment</Button>
            </Link>
          )}
        </div>

        {/* Stats row — students only */}
        {isStudent && !loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="text-center">
              <p className="text-2xl font-bold text-text">{stats.pending}</p>
              <p className="mt-1 text-sm text-muted">Pending</p>
            </Card>
            <Card className="text-center border-l-4 border-l-red-500">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="mt-1 text-sm text-muted">Overdue</p>
            </Card>
            <Card className="text-center border-l-4 border-l-green-500">
              <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
              <p className="mt-1 text-sm text-muted">Submitted</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-text">{stats.total}</p>
              <p className="mt-1 text-sm text-muted">Total</p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-text">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="all">All</option>
                {isTeacher && <option value="draft">Draft</option>}
                <option value="published">Published</option>
                {isStudent && <option value="submitted">Submitted</option>}
                {isStudent && <option value="overdue">Overdue</option>}
              </select>
            </div>
            {classSubjects.length > 0 && (
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-text">Subject</label>
                <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="all">All Subjects</option>
                  {classSubjects.map(cs => (
                    <option key={cs.id} value={cs.id}>
                      {cs.subject_name || cs.subject?.name || cs.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* List */}
        <Card title={`Assignments (${sorted.length})`}>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted">No assignments found.</p>
              {isTeacher && (
                <Link to="/assignments/create" className="mt-4 inline-block">
                  <Button size="sm">Create your first assignment</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sorted.map(a => {
                const ds = getDisplayStatus(a)
                const dueDate = new Date(a.due_date)
                const isOverdue = a.is_overdue && !submittedIds.has(a.id)
                const isDueSoon = !isOverdue && dueDate - Date.now() < 3 * 24 * 60 * 60 * 1000

                return (
                  <div key={a.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/assignments/${a.id}`}
                          className="font-semibold text-text hover:text-knhs-purple truncate">
                          {a.title}
                        </Link>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[ds] || STATUS_STYLES.draft}`}>
                          {ds.charAt(0).toUpperCase() + ds.slice(1)}
                        </span>
                        {isOverdue && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            Overdue
                          </span>
                        )}
                        {isDueSoon && !isOverdue && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            Due Soon
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {a.class_subject_name || a.subject_name || 'Unknown Subject'}
                        {' · '}
                        Due: <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {dueDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {a.max_score != null && ` · ${a.max_score} pts`}
                      </p>
                    </div>
                    <Link to={`/assignments/${a.id}`}>
                      <Button size="sm" variant={isStudent && !submittedIds.has(a.id) && a.status === 'published' ? 'primary' : 'secondary'}>
                        {isStudent ? (submittedIds.has(a.id) ? 'View' : 'Open') : 'View'}
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  )
}
