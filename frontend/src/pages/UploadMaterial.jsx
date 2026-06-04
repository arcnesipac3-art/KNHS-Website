import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { learningMaterialApi } from '../lib/learningApi'
import { classSubjectApi } from '../lib/academicApi'

export default function UploadMaterial() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const subjectParam = searchParams.get('subject')

  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(subjectParam || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('module')
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'

  // Access control
  useEffect(() => {
    if (!isTeacher) {
      navigate('/materials')
    }
  }, [user, isTeacher, navigate])

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        // Get all class subjects (teacher's subjects)
        const { data } = await classSubjectApi.getAll()
        setSubjects(data)
      } catch (err) {
        console.error('Failed to load subjects:', err)
        setError('Failed to load your subjects')
      }
    }
    if (isTeacher) {
      loadSubjects()
    }
  }, [isTeacher])

  async function handleSubmit(e) {
    e.preventDefault()

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!selectedSubject) {
      setError('Please select a subject')
      return
    }
    if (!fileUrl.trim()) {
      setError('File URL is required')
      return
    }

    setUploading(true)
    setError(null)

    try {
      await learningMaterialApi.create({
        class_subject_id: selectedSubject,
        title: title.trim(),
        description: description.trim() || null,
        type,
        file_url: fileUrl.trim(),
      })

      navigate(`/materials?subject=${selectedSubject}`)
    } catch (err) {
      console.error('Failed to upload material:', err)
      setError(err.response?.data?.error || 'Failed to upload material. Please try again.')
      setUploading(false)
    }
  }

  return (
    <PortalLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Upload Learning Material</h1>
            <p className="mt-2 text-muted">Share study materials with your students</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/materials')}>
            Cancel
          </Button>
        </div>

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Selection */}
          <Card title="Select Subject">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                required
              >
                <option value="">Choose a subject...</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name} ({subject.classroom_name})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">Select which class and subject this material is for</p>
            </div>
          </Card>

          {/* Material Details */}
          <Card title="Material Information">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Module 1: Introduction to Algebra"
                  maxLength={200}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                  required
                />
                <p className="mt-1 text-xs text-muted">{title.length}/200 characters</p>
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-text">
                  Material Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                >
                  <option value="module">📚 Module - Study modules and lesson guides</option>
                  <option value="worksheet">📝 Worksheet - Activities and exercises</option>
                  <option value="reference">📖 Reference - Reading materials</option>
                  <option value="dll">📋 DLL - Daily Lesson Log</option>
                  <option value="video">🎥 Video - Video links or recordings</option>
                  <option value="other">📄 Other - General documents</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this material covers..."
                  rows={4}
                  maxLength={500}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                />
                <p className="mt-1 text-xs text-muted">{description.length}/500 characters</p>
              </div>

              {/* File URL */}
              <div>
                <label htmlFor="fileUrl" className="block text-sm font-medium text-text">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="fileUrl"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-text focus:border-knhs-purple focus:outline-none focus:ring-2 focus:ring-knhs-purple focus:ring-opacity-20"
                  required
                />
                <div className="mt-2 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Tip:</strong> Upload your file to Google Drive, Dropbox, or OneDrive, then paste the shareable link here.
                    Make sure the link permissions are set to "Anyone with the link can view."
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/materials')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Material
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PortalLayout>
  )
}
