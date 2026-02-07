"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'MISSION_CONTROL', exact: true },
    { href: '/registry', label: 'REGISTRY' },
    { href: '/provider', label: 'PROVIDER_OPS' },
    { href: '/security', label: 'SECURITY' },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-void text-gray-300 font-mono flex flex-col">
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

      {/* GLOBAL NAVIGATION */}
      <nav className="relative z-50 flex items-center justify-between px-4 h-10 border-b border-grid bg-void/90 shrink-0 text-[10px] tracking-wider">
         <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-idle hover:text-white transition-colors">
               d4-syn
            </Link>
            <div className="h-3 w-px bg-grid" />
            
            <div className="flex gap-4">
              {navItems.map(item => {
                 const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);
                 
                 return (
                    <Link 
                       key={item.href}
                       href={item.href}
                       className={`
                          transition-colors
                          ${isActive ? 'text-white underline decoration-idle decoration-2 underline-offset-4' : 'text-gray-500 hover:text-gray-300'}
                       `}
                    >
                       {item.label}
                    </Link>
                 )
              })}
            </div>
         </div>

         <div className="flex gap-4 text-gray-600">
             <span>SYS:NORMAL</span>
             <span>NET:SEPOLIA</span>
         </div>
      </nav>

      {/* Main Content Layer */}
      <div className="relative z-20 w-full flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
