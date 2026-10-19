"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface KokonutTickerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function KokonutTicker({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: KokonutTickerProps) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={`inline-flex items-baseline font-mono font-black ${className}`}>
      {prefix && <span>{prefix}</span>}
      <motion.span>{display}</motion.span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
