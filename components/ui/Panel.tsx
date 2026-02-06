import React from "react";

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Panel({ children, title, className = "" }: PanelProps) {
  return (
    <div 
      className={`
        relative flex flex-col overflow-hidden
        border border-grid bg-void/90 backdrop-blur-sm
        ${className}
      `}
    >
      {title && (
        <div className="absolute top-0 left-0 px-2 py-1 text-xs uppercase tracking-widest text-gray-500 border-b border-grid bg-void border-r z-10 font-sans font-bold">
          {title}
        </div>
      )}
      {/* Add padding top if title exists to avoid overlap? 
          Spec says "renders as a small tab in top-left". 
          Commonly this overlays or pushes content. 
          Given "No padding" rule in design.md grid, 
          I will let the consumer handle padding or add a spacer if needed.
          But for usability, let's ensure content isn't hidden.
      */}
      <div className={`flex-1 w-full min-h-0 ${title ? 'pt-8' : ''}`}>
        {children}
      </div>
    </div>
  );
}
