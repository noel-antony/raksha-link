import clsx from 'clsx';

const colorMap = {
  primary: 'bg-primary-50 text-primary-700 border-primary-100',
  danger: 'bg-danger-100 text-danger border-danger-100/50',
  warning: 'bg-warning-100 text-warning border-warning-100/50',
  accent: 'bg-accent-100 text-accent-700 border-accent-100/50',
  secondary: 'bg-secondary-100 text-secondary-600 border-border',
};

export default function Badge({ children, color = 'primary', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        colorMap[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
