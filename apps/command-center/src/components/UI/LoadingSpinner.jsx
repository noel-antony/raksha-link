export default function LoadingSpinner({ label = 'Gemini AI is analyzing...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary-100 bg-white p-8 text-center shadow-card">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary-100 opacity-70" />
        <div className="absolute inset-2 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold text-navy">{label}</p>
        <p className="mt-1 text-sm text-slate-500">Signal fusion, prioritization, and response planning in progress.</p>
      </div>
    </div>
  );
}
