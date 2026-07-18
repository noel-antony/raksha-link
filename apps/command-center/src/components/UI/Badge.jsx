import clsx from 'clsx';

const colorMap = {
  teal: 'bg-primary-50 text-primary-700 border-primary-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  navy: 'bg-navy/10 text-navy border-navy/10',
};

export default function Badge({ children, color = 'teal', className }) {
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
