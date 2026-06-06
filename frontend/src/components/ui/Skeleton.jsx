export default function Skeleton({ className = '', variant = 'text', count = 1 }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'
  
  const variantClasses = {
    text: 'h-4 w-full mb-2',
    title: 'h-8 w-3/4 mb-4',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-32 w-full mb-4',
    button: 'h-10 w-24',
    badge: 'h-6 w-16 rounded-full',
  }

  const items = Array.from({ length: count })

  return (
    <>
      {items.map((_, i) => (
        <div 
          key={i} 
          className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
        />
      ))}
    </>
  )
}
