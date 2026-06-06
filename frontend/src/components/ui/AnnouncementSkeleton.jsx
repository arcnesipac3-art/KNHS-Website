import Skeleton from './Skeleton'

export default function AnnouncementSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex gap-3">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="text" className="h-3 w-20" />
                <Skeleton variant="text" className="h-3 w-16" />
              </div>
              <Skeleton variant="title" className="h-6 w-3/4" />
              <Skeleton variant="text" count={3} />
              <div className="flex gap-4 pt-2">
                <Skeleton variant="badge" />
                <Skeleton variant="badge" />
                <Skeleton variant="badge" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
