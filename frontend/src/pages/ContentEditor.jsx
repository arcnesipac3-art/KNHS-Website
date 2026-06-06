import { useState, useEffect } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../lib/api'

export default function ContentEditor() {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [editing, setEditing] = useState(false)
  const [filterSection, setFilterSection] = useState('all')

  useEffect(() => {
    loadBlocks()
  }, [filterSection])

  async function loadBlocks() {
    try {
      const params = filterSection !== 'all' ? { section: filterSection } : {}
      const response = await api.get('/core/content-blocks/', { params })
      setBlocks(response.data)
    } catch (error) {
      console.error('Failed to load content blocks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      key: formData.get('key'),
      title: formData.get('title'),
      section: formData.get('section'),
      content_type: formData.get('content_type'),
      content: formData.get('content'),
      is_active: formData.get('is_active') === 'true',
    }

    try {
      if (selectedBlock) {
        await api.put(`/core/content-blocks/${selectedBlock.id}/`, data)
      } else {
        await api.post('/core/content-blocks/', data)
      }
      setEditing(false)
      setSelectedBlock(null)
      loadBlocks()
    } catch (error) {
      console.error('Failed to save content block:', error)
      alert('Failed to save content block. Please try again.')
    }
  }

  async function handleDelete(blockId) {
    if (!confirm('Are you sure you want to delete this content block?')) return

    try {
      await api.delete(`/core/content-blocks/${blockId}/`)
      loadBlocks()
    } catch (error) {
      console.error('Failed to delete content block:', error)
      alert('Failed to delete content block. Please try again.')
    }
  }

  function handleEdit(block) {
    setSelectedBlock(block)
    setEditing(true)
  }

  function handleCreate() {
    setSelectedBlock(null)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setSelectedBlock(null)
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Content Editor</h1>
            <p className="mt-2 text-muted">Manage website content blocks</p>
          </div>
          <Button onClick={handleCreate}>Create New Block</Button>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-text">Filter by Section:</label>
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
            >
              <option value="all">All Sections</option>
              <option value="home_hero">Home - Hero</option>
              <option value="home_about">Home - About</option>
              <option value="home_features">Home - Features</option>
              <option value="about_mission">About - Mission</option>
              <option value="about_vision">About - Vision</option>
              <option value="about_history">About - History</option>
              <option value="academics_jhs">Academics - JHS</option>
              <option value="academics_shs">Academics - SHS</option>
              <option value="contact_info">Contact - Info</option>
              <option value="contact_form">Contact - Form</option>
              <option value="news_events">News & Events</option>
              <option value="enrollment_info">Enrollment</option>
              <option value="footer">Footer</option>
            </select>
          </div>
        </Card>

        {editing ? (
          <Card className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-text">
              {selectedBlock ? 'Edit Content Block' : 'Create New Content Block'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Key</label>
                <input
                  type="text"
                  name="key"
                  defaultValue={selectedBlock?.key || ''}
                  required
                  placeholder="e.g., home_hero_title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={selectedBlock?.title || ''}
                  required
                  placeholder="Human-readable title"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Section</label>
                <select
                  name="section"
                  defaultValue={selectedBlock?.section || 'home_hero'}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                >
                  <option value="home_hero">Home - Hero</option>
                  <option value="home_about">Home - About</option>
                  <option value="home_features">Home - Features</option>
                  <option value="about_mission">About - Mission</option>
                  <option value="about_vision">About - Vision</option>
                  <option value="about_history">About - History</option>
                  <option value="academics_jhs">Academics - JHS</option>
                  <option value="academics_shs">Academics - SHS</option>
                  <option value="contact_info">Contact - Info</option>
                  <option value="contact_form">Contact - Form</option>
                  <option value="news_events">News & Events</option>
                  <option value="enrollment_info">Enrollment</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Content Type</label>
                <select
                  name="content_type"
                  defaultValue={selectedBlock?.content_type || 'text'}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                >
                  <option value="text">Plain Text</option>
                  <option value="html">HTML</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Content</label>
                <textarea
                  name="content"
                  defaultValue={selectedBlock?.content || ''}
                  required
                  rows={10}
                  placeholder="Content of the block"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-knhs-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={selectedBlock?.is_active !== false}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-text">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-text">Content Blocks</h2>
            {blocks.length === 0 ? (
              <p className="text-muted">No content blocks found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Key</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Title</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Section</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Type</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Updated</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map(block => (
                      <tr key={block.id} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-sm text-text">{block.key}</td>
                        <td className="px-4 py-3 text-sm text-text">{block.title}</td>
                        <td className="px-4 py-3 text-sm text-text">{block.section_display}</td>
                        <td className="px-4 py-3 text-sm text-text">{block.content_type_display}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              block.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {block.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {new Date(block.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEdit(block)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDelete(block.id)}
                            >
                              Delete
                            </Button>
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
