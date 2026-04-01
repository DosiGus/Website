"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransitionWrapper({
  children,
  className = "",
}: PageTransitionWrapperProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        id="app-main"
        className={`flex-1 space-y-6 bg-[var(--app-bg-base)] px-10 py-8 sm:px-16 sm:py-10 ${className}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 26,
          mass: 0.8,
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
