import Skeleton from './Skeleton'

export default function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Skeleton banner */}
      <Skeleton variant="card" className="h-32" />
      
      {/* Skeleton KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="card" className="h-24" />
        ))}
      </div>
      
      {/* Skeleton content */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-48" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-48" />
        </div>
      </div>
    </div>
  )
}
