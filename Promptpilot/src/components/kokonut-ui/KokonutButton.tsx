"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KokonutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const VARIANTS = {
  primary: "bg-white text-black hover:bg-neutral-100 shadow-sm border border-transparent",
  secondary: "bg-[#2c2c2e] text-white hover:bg-[#3a3a3c] border border-white/[0.08]",
  ghost: "bg-transparent text-neutral-300 hover:text-white hover:bg-white/[0.06]",
};

const SIZES = {
  sm: "px-3.5 py-1.5 text-xs rounded-full gap-1.5",
  md: "px-5 py-2.5 text-xs rounded-full gap-2",
  lg: "px-7 py-3 text-sm rounded-full gap-2.5",
};

export function KokonutButton({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: KokonutButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-tight select-none transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">{children}</span>
    </button>
  );
}
