import React from "react";

interface PaneProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Pane({ children, className = "", title }: PaneProps) {
  return (
    <div 
      className={`
        relative h-full flex flex-col overflow-hidden 
        border border-[#333] 
        shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] 
        bg-void-light/50
        ${className}
      `}
    >
      {title && (
        <div className="px-2 py-1 text-xs uppercase tracking-widest text-[#666] border-b border-[#333] w-full bg-void shrink-0 z-10">
          {title}
        </div>
      )}
      <div className="flex-1 w-full p-4 overflow-auto min-h-0">
        {children}
      </div>
    </div>
  );
}
