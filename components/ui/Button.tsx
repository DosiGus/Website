"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-outline";

type ButtonSize = "sm" | "md" | "lg";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

// Omit event handlers that conflict with motion.button's type overrides
type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onDrag" | "onDragEnd" | "onDragStart" | "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"
  | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
> &
  ButtonClassOptions & {
    loading?: boolean;
    children: ReactNode;
  };

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonClassOptions = {}) {
  const base =
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#2450b2] text-white shadow-[0_2px_16px_rgba(36,80,178,0.25)] hover:bg-[#1a46c4]",
    secondary:
      "border border-[#2a4ea7]/20 bg-white/70 text-[#171923] hover:bg-white",
    ghost: "text-[#475569] hover:bg-[#F0F4F9] hover:text-[#0F172A]",
    danger: "bg-[#EF4444] text-white shadow-[0_2px_12px_rgba(239,68,68,0.25)] hover:bg-[#DC2626]",
    "danger-outline":
      "border border-[#EF4444] bg-white text-[#EF4444] hover:bg-[#FEE2E2]",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "min-h-10 px-4 py-2 text-sm",
    md: "min-h-11 px-5 py-2.5 text-[15px]",
    lg: "min-h-12 px-6 py-3 text-base",
  };

  return [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/12 to-transparent"
        />
      )}
      <span className={`inline-flex items-center gap-2 ${loading ? "opacity-0" : "opacity-100"}`}>{children}</span>
      {loading ? (
        <Loader2
          className="absolute h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      ) : null}
    </motion.button>
  );
}
