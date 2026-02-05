// components/brain/BrainConsole.tsx
import React, { useState, useEffect, useRef } from 'react';

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
    // Don't clear input immediately so user remembers what they asked
  };

  const isWorking = status !== 'IDLE' && status !== 'COMPLETED' && status !== 'ERROR';

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Output Screen */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-black/50 border border-grid p-4 font-mono text-sm overflow-y-auto min-h-75 relative"
      >
        {!content && status === 'IDLE' && (
           <div className="opacity-30 flex flex-col items-center justify-center h-full">
               <p>_SYSTEM.READY</p>
               <p>_AWAITING_PROMPT</p>
           </div>
        )}
        
        {content && (
           <div className="text-data whitespace-pre-wrap leading-relaxed">
             {content}
             {isWorking && <span className="animate-pulse inline-block w-2 H-4 bg-data ml-1">_</span>}
           </div>
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isWorking}
            placeholder={isWorking ? "PROCESSING..." : "ENTER COMMAND..."}
            className="w-full bg-void border border-grid p-3 text-white font-mono focus:border-idle focus:outline-none focus:shadow-glow-idle disabled:opacity-50"
          />
          <div className="absolute right-2 top-2">
            {isWorking ? (
               <button 
                 type="button" 
                 onClick={onStop}
                 className="text-[10px] bg-heat/20 text-heat px-2 py-1 border border-heat border-opacity-50 hover:bg-heat/40"
               >
                 ABORT
               </button>
            ) : (
                <button 
                 type="submit" 
                 className="text-[10px] bg-idle/20 text-idle px-2 py-1 border border-idle border-opacity-50 hover:bg-idle/40"
               >
                 EXECUTE
               </button>
            )}
          </div>
      </form>
    </div>
  );
}
