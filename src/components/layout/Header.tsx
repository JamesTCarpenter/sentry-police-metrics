import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-navy md:flex md:h-[68px] md:items-center md:justify-between md:bg-white md:px-8">
      <div className="flex h-[60px] items-center px-5 md:hidden">
        <Image
          src="/sentry-main-logo.png"
          alt="Sentry"
          width={140}
          height={41}
          priority
          className="h-9 w-auto object-contain"
        />
      </div>

      <div className="border-b border-border bg-white px-5 py-3 md:hidden">
        <p className="text-[11px] text-text-secondary">
          Metropolitan Police Service
        </p>
        <p className="text-sm font-semibold text-text-primary">
          Stop & Search Intelligence
        </p>
      </div>

      <div className="hidden md:block">
        <p className="text-[11px] text-text-secondary sm:text-xs">
          Metropolitan Police Service
        </p>
        <p className="text-sm font-semibold text-text-primary sm:text-base">
          Stop & Search Intelligence
        </p>
      </div>
    </header>
  );
}
