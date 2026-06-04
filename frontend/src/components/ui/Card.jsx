export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-text">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
