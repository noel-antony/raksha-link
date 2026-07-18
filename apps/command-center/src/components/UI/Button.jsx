import clsx from 'clsx';

const variantMap = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-200',
  secondary: 'bg-white text-navy border border-slate-200 hover:bg-slate-50 focus:ring-slate-200',
  danger: 'bg-crisis-red text-white hover:bg-red-700 focus:ring-red-200',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200',
  success: 'bg-crisis-green text-white hover:bg-green-700 focus:ring-green-200',
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
        ? 'px-5 py-3 text-base'
        : 'px-4 py-2.5 text-sm';

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium shadow-sm transition-all duration-200 ease-smooth focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        variantMap[variant],
        sizeClasses,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}
