import type { ReactNode } from "react";

interface PageHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({ badge, title, description, action }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      {/* Left accent bar */}
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-[#2450b2]" />

      <div className="relative flex flex-wrap items-center justify-between gap-6 px-8 py-7">
        <div>
          {badge && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2450b2]">
              {badge}
            </p>
          )}
          <h1 className={["text-[30px] font-bold tracking-tight text-[#0F172A]", badge ? "mt-2" : ""].join(" ")}>
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[15px] text-[#64748B]">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
