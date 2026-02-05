// components/brain/TerminalLogs.tsx
import React, { useEffect, useRef } from 'react';
import { BrainLog } from '@/lib/agent-brain';

interface TerminalLogsProps {
  logs: BrainLog[];
}

export function TerminalLogs({ logs }: TerminalLogsProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="font-mono text-[10px] space-y-1 h-37.5 overflow-y-auto w-full">
        {logs.map((log, i) => {
            let typeColor = 'text-gray-500';
            if (log.type === 'ARB') typeColor = 'text-heat font-bold animate-pulse';
            if (log.type === 'YEL') typeColor = 'text-idle';
            if (log.type === 'ENS') typeColor = 'text-data';
            if (log.type === 'ERROR') typeColor = 'text-red-500';

            return (
                <div key={i} className="flex gap-2 w-full break-all">
                    <span className="opacity-30 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    <span className={`w-8 text-right shrink-0 ${typeColor}`}>
                        [{log.type}]
                    </span>
                    <span className="opacity-80 flex-1">
                        {log.message}
                    </span>
                </div>
            )
        })}
        <div ref={endRef} />
    </div>
  );
}
