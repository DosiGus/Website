import "../globals.css";
import { ReactNode } from "react";
import AppAuthGate from "../../components/AppAuthGate";
import AppSidebar from "../../components/app/AppSidebar";
import AppTopbar from "../../components/app/AppTopbar";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppAuthGate>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="grid min-h-screen grid-cols-[240px_1fr]">
          <AppSidebar />
          <div className="flex flex-col">
            <AppTopbar />
            <main className="flex-1 space-y-10 bg-slate-50 px-8 py-10">{children}</main>
          </div>
        </div>
      </div>
    </AppAuthGate>
  );
}
