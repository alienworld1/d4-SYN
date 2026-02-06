// components/brain/TerminalLogs.tsx
import React, { useEffect, useRef } from 'react';
import { BrainLog } from '@/lib/agent-brain';
import { Ticker } from '@/components/ui/Ticker';

interface TerminalLogsProps {
  logs: BrainLog[];
}

export function TerminalLogs({ logs }: TerminalLogsProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="font-mono text-[10px] space-y-1 h-37.5 overflow-y-auto w-full scrollbar-custom bg-black/20 p-2 border border-grid/50">
        {logs.map((log, i) => {
            let typeColor = 'text-cold';
            if (log.type === 'ARB') typeColor = 'text-heat font-bold animate-glitch';
            if (log.type === 'YEL') typeColor = 'text-idle';
            if (log.type === 'ENS' || log.type === 'DISCOVERY') typeColor = 'text-data';
            if (log.type === 'THOUGHT') typeColor = 'text-data italic opacity-80'; // Cyan, distinct
            if (log.type === 'OP') typeColor = 'text-warn font-bold underline decoration-dotted'; // Amber
            if (log.type === 'DATA') typeColor = 'text-idle'; // Green
            if (log.type === 'WARN') typeColor = 'text-warn';
            if (log.type === 'ERROR') typeColor = 'text-red-500 font-bold';

            return (
                <div key={i} className="flex gap-2 w-full break-all hover:bg-white/5 transition-colors leading-tight">
                    <span className="opacity-30 whitespace-nowrap text-[9px]">
                        [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
                    </span>
                    <span className={`w-8 text-right shrink-0 ${typeColor} tracking-tighter font-bold`}>
                        [{log.type}]
                    </span>
                    <span className="opacity-80 flex-1 text-gray-300">
                        {log.message}
                    </span>
                </div>
            )
        })}
        <div ref={endRef} />
    </div>
  );
}
