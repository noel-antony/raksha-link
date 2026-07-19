import clsx from 'clsx';

const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100';

const variants = {
  primary: 'bg-primary-700 text-white hover:bg-primary-600 hover:shadow-md border border-transparent',
  secondary: 'bg-secondary-50 text-secondary-900 border border-border hover:bg-secondary-100 hover:border-secondary-200',
  outline: 'border-2 border-border bg-transparent text-secondary-900 hover:border-secondary-900 hover:bg-secondary-50',
  ghost: 'bg-transparent text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
  danger: 'bg-danger text-white hover:bg-danger/90 hover:shadow-md border border-transparent',
  success: 'bg-accent-700 text-white hover:bg-accent hover:shadow-md border border-transparent',
};

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props
}) {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-2 text-sm'
      : size === 'lg'
        ? 'px-6 py-3.5 text-base'
        : 'px-4 py-2.5 text-sm';

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant] || variants.primary,
        sizeClasses,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />}
      {children}
    </button>
  );
}
