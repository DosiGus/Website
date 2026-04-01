import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "accent";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function badgeClassName(
  variant: BadgeVariant = "neutral",
  className = "",
) {
  const base =
    "inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]";

  const variants: Record<BadgeVariant, string> = {
    success: "bg-[#D1FAE5] text-[#047857]",
    warning: "bg-[#FEF3C7] text-[#B45309]",
    danger: "bg-[#FEE2E2] text-[#B91C1C]",
    info: "bg-[#E0F2FE] text-[#0369A1]",
    neutral: "bg-[#E2E8F0] text-[#475569]",
    accent: "bg-[#DBEAFE] text-[#1D4ED8]",
  };

  return [base, variants[variant], className].filter(Boolean).join(" ");
}

export default function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={badgeClassName(variant, className)} {...props}>
      {children}
    </span>
  );
}
