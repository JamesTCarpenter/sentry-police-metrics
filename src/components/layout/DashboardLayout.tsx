import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNavigation from "./MobileNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-medium focus:text-navy focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="md:pl-[248px]">
        <Header />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] px-5 pt-5 pb-24 md:p-8"
        >
          {children}
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
