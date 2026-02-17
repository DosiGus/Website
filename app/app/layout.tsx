import "../globals.css";
import { ReactNode } from "react";
import AppAuthGate from "../../components/AppAuthGate";
import AppSidebar from "../../components/app/AppSidebar";
import AppTopbar from "../../components/app/AppTopbar";
import OnboardingGuide from "../../components/app/OnboardingGuide";
import VerticalGate from "../../components/app/VerticalGate";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGate>
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="grid min-h-screen grid-cols-[260px_1fr]">
          <AppSidebar />
          <div className="flex flex-col">
            <AppTopbar />
            <main className="flex-1 space-y-8 bg-zinc-950 px-8 py-8">{children}</main>
            <OnboardingGuide />
            <VerticalGate />
          </div>
        </div>
      </div>
    </AppAuthGate>
  );
}
