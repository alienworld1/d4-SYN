import React from "react";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void text-gray-300 font-mono">
      {/* Visual Overlay: Noise Grain */}
      <div className="noise-grain fixed inset-0 pointer-events-none z-40" />
      
      {/* Visual Overlay: Scanlines */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50 opacity-20" />

      {/* Main Content Layer */}
      <div className="relative z-0 w-full h-full">
        {children}
      </div>
    </div>
  );
}
