import React from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { useTelemetry } from '@/hooks/useTelemetry';

export function SLAChart() {
  const data = useTelemetry(50);

  return (
    <div className="w-full h-full relative font-mono text-[10px] select-none cursor-crosshair">
       <div className="absolute top-1 left-2 text-data opacity-50 z-10 flex gap-2">
            <span>LATITUDE: {data[data.length-1]?.latency.toFixed(0)}ms</span>
            <span className={data[data.length-1]?.isPenalty ? "text-heat animate-pulse" : "text-idle"}>
                PAY: {data[data.length-1]?.payment.toFixed(4)}
            </span>
       </div>
       
       <ResponsiveContainer width="100%" height={128}>
         <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
           {/* Latency Axis (Left, Auto scaled for spikes) */}
           <YAxis 
             yAxisId="latency" 
             hide 
             domain={['auto', 'auto']} 
           />
           {/* Payment Axis (Right, Fixed 0-MAX) */}
           {/* We fix the domain slightly higher than 0.005 to keep the green line high */}
           <YAxis 
             yAxisId="payment" 
             orientation="right" 
             hide 
             domain={[0, 0.006]} 
           />
           
           <defs>
             {/* 
                Gradient Trick: 
                Since "Penalty" means Low Payment, we map simple Y-value to color.
                Top (High Pay) = Green/Idle
                Bottom (Low Pay) = Red/Heat
             */}
             <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#00FF41" /> 
               <stop offset="60%" stopColor="#00FF41" />
               <stop offset="90%" stopColor="#FF2A00" />
               <stop offset="100%" stopColor="#FF2A00" />
             </linearGradient>
           </defs>

           {/* Latency Line (Cyan) - Jagged */}
           <Line 
             yAxisId="latency"
             type="linear" 
             dataKey="latency" 
             stroke="#00F3FF" 
             strokeWidth={1}
             dot={false}
             isAnimationActive={false}
           />

           {/* Payment Line (Green/Red) - Stepped */}
           <Line 
             yAxisId="payment"
             type="stepAfter" 
             dataKey="payment" 
             stroke="url(#paymentGradient)" 
             strokeWidth={2}
             dot={false}
             isAnimationActive={false}
           />
         </LineChart>
       </ResponsiveContainer>
       
       {/* CRT Scanline Overlay */}
       <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay" style={{
           backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)',
           backgroundSize: '4px 4px'
       }}></div>
    </div>
  );
}
