export default function Sidebar({ children, className = '' }) {
  return (
    <aside className={`h-full rounded-none bg-navy text-white shadow-card lg:rounded-r-3xl ${className}`}>
      {children}
    </aside>
  );
}
