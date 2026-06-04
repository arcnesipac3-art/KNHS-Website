export default function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-knhs-purple focus:ring-2 focus:ring-purple-100'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
