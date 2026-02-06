import React from "react";

type BadgeVariant = "idle" | "heat" | "warn" | "cold";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function Badge({ 
  variant = "idle", 
  children, 
  className = "",
  animate = false
}: BadgeProps) {
  
  let colorClass = "";
  
  switch (variant) {
    case "idle":
      colorClass = "text-idle border-idle";
      break;
    case "heat":
      colorClass = "text-heat border-heat";
      break;
    case "warn":
      colorClass = "text-warn border-warn";
      break;
    case "cold":
      colorClass = "text-cold border-cold";
      break;
  }

  const animationClass = animate ? "animate-pulse" : "";

  return (
    <span className={`
      text-xs px-1 border border-current inline-block font-mono uppercase tracking-tight
      ${colorClass} ${animationClass} ${className}
    `}>
      {children}
    </span>
  );
}
