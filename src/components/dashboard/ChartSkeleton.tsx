interface ChartSkeletonProps {
  height?: number;
}

export default function ChartSkeleton({ height }: ChartSkeletonProps) {
  return (
    <div
      className="h-full w-full animate-pulse"
      style={height ? { height } : undefined}
      aria-hidden="true"
    >
      <div className="flex h-full items-end gap-2 sm:gap-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 rounded-t bg-slate-100"
            style={{
              height: `${25 + ((index * 17) % 65)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
