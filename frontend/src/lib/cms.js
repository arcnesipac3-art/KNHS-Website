import api from './api'

export async function getContentBlocks(section = null) {
  try {
    const params = section ? { section } : {}
    const response = await api.get('/core/content-blocks/public/', { params })
    // Convert array to object keyed by block key for easy access
    const blocks = {}
    response.data.forEach(block => {
      blocks[block.key] = block
    })
    return blocks
  } catch (error) {
    console.error('Failed to fetch CMS content:', error)
    return {}
  }
}

export async function getContentBlock(key) {
  try {
    const response = await api.get('/core/content-blocks/public/')
    const block = response.data.find(b => b.key === key)
    return block || null
  } catch (error) {
    console.error('Failed to fetch CMS content block:', error)
    return null
  }
}
