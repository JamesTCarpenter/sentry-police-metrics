export default function MetricCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl bg-white p-4 sm:p-5"
      aria-hidden="true"
    >
      <div className="h-4 w-28 rounded bg-slate-200" />

      <div className="mt-4 h-7 w-36 rounded bg-slate-200 sm:h-8" />

      <div className="mt-3 h-3 w-44 rounded bg-slate-100" />
    </div>
  );
}
