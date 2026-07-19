export default function Skeleton({ className, ...props }) {
  return (
    <div 
      className={`animate-skeleton rounded-lg bg-secondary-100 ${className}`} 
      {...props} 
    />
  );
}
