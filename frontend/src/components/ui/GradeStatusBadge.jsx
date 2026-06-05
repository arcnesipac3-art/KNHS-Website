import React from 'react'

export default function GradeStatusBadge({ status }) {
  const config = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: '📝'
    },
    computed: {
      label: 'Computed',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: '🧮'
    },
    pending_approval: {
      label: 'Pending Review',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      icon: '⏳'
    },
    published: {
      label: 'Published',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: '✅'
    },
    locked: {
      label: 'Locked',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      icon: '🔒'
    }
  }

  const { label, bgColor, textColor, icon } = config[status] || config.draft

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${bgColor} ${textColor}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}
