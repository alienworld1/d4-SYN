import React from "react";

interface TickerProps {
  value: string | number;
  label?: string;
  className?: string;
}

export function Ticker({ value, label, className = "" }: TickerProps) {
  return (
    <div className={`font-mono tracking-tighter ${className}`}>
      {label && <span className="text-gray-500 mr-2 text-xs uppercase">{label}</span>}
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}
