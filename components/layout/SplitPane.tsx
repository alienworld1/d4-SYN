"use client";

import React, { useState, useEffect, useRef } from "react";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitPane({ left, right }: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(60); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Clamp between 30% and 70%
      const clampedWidth = Math.min(Math.max(newLeftWidth, 30), 70);
      setLeftWidth(clampedWidth);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row w-full h-full">
      {/* Left Pane (Human Output) */}
      <div 
        className="h-1/2 md:h-full w-full md:w-(--width) transition-none"
        style={{ "--width": `${leftWidth}%` } as React.CSSProperties}
      >
        {left}
      </div>

      {/* The Bus (Divider) */}
      <div
        className={`
          hidden md:block
          w-px h-full cursor-col-resize z-30 transition-colors duration-150
          ${isDragging ? "bg-synapse shadow-[0_0_10px_var(--color-synapse)]" : "bg-grid hover:bg-discovery hover:shadow-[0_0_10px_var(--color-discovery)]"}
        `}
        onMouseDown={startDrag}
      />

      {/* Mobile Divider (Horizontal) - Static for MVP */}
      <div className="md:hidden h-px w-full bg-grid" />

      {/* Right Pane (Machine Mind) */}
      <div className="flex-1 h-1/2 md:h-full overflow-hidden">
        {right}
      </div>
    </div>
  );
}
