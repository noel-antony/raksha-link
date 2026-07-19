import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ 
  label = 'Loading Operations Center...',
  description = 'Connecting to RakshaLink core systems.' 
}) {
  return (
    <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="relative h-12 w-12 text-primary-600">
          <Loader2 className="h-full w-full animate-spin" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-secondary-900">{label}</p>
          <p className="mt-1 text-sm text-secondary-500 max-w-[250px] mx-auto">{description}</p>
        </div>
      </div>
    </div>
  );
}
