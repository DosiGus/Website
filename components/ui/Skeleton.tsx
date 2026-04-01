import { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

export default function Skeleton({ width, height, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`shimmer rounded bg-transparent ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          style={{ width: i === lines - 1 && lines > 1 ? "75%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`app-card rounded-lg p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton height={13} width={96} />
          <Skeleton height={28} width={64} />
        </div>
        <Skeleton height={32} width={32} className="rounded-[8px]" />
      </div>
      <Skeleton height={13} width={160} className="mt-3" />
    </div>
  );
}
