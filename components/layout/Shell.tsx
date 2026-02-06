import React from "react";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void text-gray-300 font-mono">
      {/* Layer 2: Radial Gradient Dots (Grid) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(var(--color-grid) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Layer 3: Scanline Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 1px,
            rgba(0, 0, 0, 0.5) 2px,
            rgba(0, 0, 0, 0.5) 3px
          )`
        }}
      />
      
      {/* Optional: Vignette for depth */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Main Content Layer */}
      <div className="relative z-20 w-full h-full">
        {children}
      </div>
    </div>
  );
}
