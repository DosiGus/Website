import "../globals.css";
import { ReactNode } from "react";
import AppAuthGate from "../../components/AppAuthGate";
import AppSidebar from "../../components/app/AppSidebar";
import OnboardingGuide from "../../components/app/OnboardingGuide";
import PageTransitionWrapper from "../../components/app/PageTransitionWrapper";
import VerticalGate from "../../components/app/VerticalGate";
import { ToastProvider } from "../../components/ui/Toast";
import MobileTopbar from "../../components/app/MobileTopbar";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGate>
      <ToastProvider>
        <div className="app-shell min-h-screen bg-[var(--app-bg-base)] text-[var(--app-text-primary)]">
          <a
            href="#app-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-[#0F172A]"
          >
            Zum Inhalt springen
          </a>

          <div className="min-h-screen lg:grid lg:grid-cols-[var(--app-sidebar-width)_minmax(0,1fr)]">
            <AppSidebar />
            <div className="flex min-w-0 flex-col">
              <MobileTopbar />
              <PageTransitionWrapper>
                {children}
              </PageTransitionWrapper>
              <OnboardingGuide />
              <VerticalGate />
            </div>
          </div>
        </div>
      </ToastProvider>
    </AppAuthGate>
  );
}
