interface DetailItemProps {
  label: string;
  value: string | null;
}

export default function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 pb-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-text-secondary">{label}</dt>

      <dd className="min-w-0 break-words text-sm font-medium text-text-primary sm:max-w-[60%] sm:text-right">
        {value?.trim() ? value : "Not recorded"}
      </dd>
    </div>
  );
}
