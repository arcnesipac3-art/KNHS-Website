export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-knhs-purple text-white hover:bg-knhs-purple-light',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:border-knhs-purple hover:text-knhs-purple',
    ghost: 'text-knhs-purple hover:bg-purple-50',
  }

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
