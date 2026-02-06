// components/brain/BrainConsole.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface BrainConsoleProps {
  status: string;
  content: string;
  onStart: (prompt: string) => void;
  onStop: () => void;
}

export function BrainConsole({ status, content, onStart, onStop }: BrainConsoleProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of stream
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onStart(input);
  };

  const isWorking = status !== 'IDLE' && status !== 'COMPLETED' && status !== 'ERROR';

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Output Screen */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-black/50 border border-grid p-4 font-mono text-sm overflow-y-auto min-h-75 relative scrollbar-custom"
      >
        {!content && status === 'IDLE' && (
           <div className="opacity-30 flex flex-col items-center justify-center h-full select-none">
               <p>_SYSTEM.READY</p>
               <p>_AWAITING_PROMPT</p>
           </div>
        )}
        
        {content && (
           <div className="text-data whitespace-pre-wrap leading-relaxed shadow-[0_0_15px_rgba(0,243,255,0.1)]">
             {content}
             {isWorking && <span className="animate-pulse inline-block w-2 h-4 bg-data ml-1 align-middle"></span>}
           </div>
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="relative flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isWorking}
            placeholder={isWorking ? "PROCESSING..." : "ENTER COMMAND..."}
            className="flex-1 bg-void border border-grid p-3 text-white font-mono focus:border-idle focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] disabled:opacity-50"
          />
          <div className="w-24">
            {isWorking ? (
               <Button 
                 type="button" 
                 variant="heat"
                 onClick={onStop}
                 className="w-full h-full text-[10px]"
               >
                 ABORT
               </Button>
            ) : (
                <Button 
                 type="submit" 
                 variant="idle"
                 className="w-full h-full text-[10px]"
               >
                 EXECUTE
               </Button>
            )}
          </div>
      </form>
    </div>
  );
}
