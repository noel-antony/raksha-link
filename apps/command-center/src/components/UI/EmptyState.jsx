import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = "No data available", 
  description = "There is currently nothing to display here.",
  actionLabel,
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-secondary-900">{title}</h3>
      <p className="mt-2 text-sm text-secondary-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
