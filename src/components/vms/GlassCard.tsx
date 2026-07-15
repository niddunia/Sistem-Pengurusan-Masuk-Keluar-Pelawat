"use client";

import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  variant = "default",
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "soft" | "panel";
  hover?: boolean;
}) {
  const variantClass =
    variant === "soft"
      ? "glass-card-soft"
      : variant === "panel"
      ? "glass-panel"
      : "glass-card";

  return (
    <div
      className={cn(
        variantClass,
        hover && "hover-lift cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassButton({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger" | "success" | "warning";
}) {
  const variantClass =
    variant === "ghost"
      ? "bg-white/10 hover:bg-white/20 text-foreground border border-white/20"
      : variant === "outline"
      ? "bg-transparent border border-white/40 hover:bg-white/10 text-foreground"
      : variant === "danger"
      ? "bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-400/30 shadow-lg shadow-red-900/30"
      : variant === "success"
      ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border border-emerald-400/30 shadow-lg shadow-emerald-900/30"
      : variant === "warning"
      ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-300/30 shadow-lg shadow-amber-900/30"
      : "glass-button";

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:translate-y-[-2px]",
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
