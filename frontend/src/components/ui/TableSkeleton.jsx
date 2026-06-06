import Skeleton from './Skeleton'

export default function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex gap-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-6 w-24" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-3 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
