import React, { useEffect, useRef, useState } from 'react';
import { useTelemetry, TelemetryPoint } from '@/hooks/useTelemetry';

export function AuditLog() {
  const data = useTelemetry(100);
  const endRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll logic
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]);

  // Filter out the initial zero-filled buffer if it's annoying, or just render it as blank
  // The hook returns 50 initial items. We only want to show real items maybe?
  // Let's just filter for timestamp > 0.
  const activeLogs = data.filter(d => d.timestamp > 0);

  return (
    <div className="flex flex-col h-full font-mono text-[10px] bg-black/40 relative overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-grid py-1 px-2 text-void bg-idle font-bold select-none sticky top-0 z-10 opacity-80">
         <span className="w-16">NONCE</span>
         <span className="w-16">LATENCY</span>
         <span className="w-16">AMT</span>
         <span className="w-16">STATUS</span>
         <span className="flex-1 text-right">SIGNATURE</span>
      </div>

      {/* Log Body */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-custom space-y-px">
          {activeLogs.length === 0 && (
             <div className="text-gray-600 italic p-4 text-center opacity-50">
                 _AWAITING_STATE_UPDATES...
             </div>
          )}

          {activeLogs.map((log, i) => {
              let color = "text-idle/60"; // OK
              if (log.status === 'WARN' || log.isPenalty) color = "text-warn";
              if (log.status === 'CRITICAL') color = "text-heat font-bold";
              
              const nonceDisplay = log.nonce ? `#${log.nonce.toString().padEnd(4)}` : 'INIT';
              const sigDisplay = log.signature ? `${String(log.signature).substring(0, 10)}...` : 'PENDING';
              
              return (
                  <div key={i} className={`flex hover:bg-white/5 transition-colors ${color} cursor-default`}>
                      <span className="w-16 font-mono opacity-70">{nonceDisplay}</span>
                      <span className="w-16">{Math.round(log.latency)}ms</span>
                      <span className="w-16 opacity-90">${log.payment.toFixed(4)}</span>
                      <span className="w-16 font-bold">{log.status || (log.isPenalty ? 'WARN' : 'OK')}</span>
                      <span className="flex-1 text-right opacity-40 font-mono tracking-tighter">{sigDisplay}</span>
                  </div>
              )
          })}
          <div ref={endRef} />
      </div>

      {/* Fade Overlay */}
      <div className="absolute top-0 left-0 w-full h-8 bg-linear-to-b from-void/50 to-transparent pointer-events-none"></div>
    </div>
  );
}
