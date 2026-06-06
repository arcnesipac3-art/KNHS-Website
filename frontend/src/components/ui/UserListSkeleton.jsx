import Skeleton from './Skeleton'

export default function UserListSkeleton({ count = 10 }) {
  return (
    <div className="py-12">
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-4 w-48" />
              <Skeleton variant="text" className="h-3 w-32" />
            </div>
            <Skeleton variant="badge" />
            <Skeleton variant="badge" />
            <div className="flex gap-2">
              <Skeleton variant="button" />
              <Skeleton variant="button" />
              <Skeleton variant="button" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
