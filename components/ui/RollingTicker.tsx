"use client";

import React, { useEffect, useState, useRef } from 'react';

interface RollingTickerProps {
    value: number;
    prefix?: string;
    className?: string;
}

// Simple spring physics simulation
// F = -kx - cv
// k = stiffness, c = damping
const STIFFNESS = 170;
const DAMPING = 26;

export function RollingTicker({ value, prefix = "$", className = "" }: RollingTickerProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const velocity = useRef(0);
    const target = useRef(value);
    const current = useRef(value);
    const requestRef = useRef<number>(0);
    const lastTime = useRef<number>(0);

    useEffect(() => {
        target.current = value;
    }, [value]);

    useEffect(() => {
        const animate = (time: number) => {
            if (!lastTime.current) lastTime.current = time;
            const dt = (time - lastTime.current) / 1000;
            lastTime.current = time;

            // Spring logic
            const displacement = current.current - target.current;
            const force = -STIFFNESS * displacement - DAMPING * velocity.current;
            const acceleration = force; // mass = 1

            velocity.current += acceleration * dt;
            current.current += velocity.current * dt;

            // Snap to target if very close
            if (Math.abs(displacement) < 0.0001 && Math.abs(velocity.current) < 0.001) {
                current.current = target.current;
                velocity.current = 0;
            }

            setDisplayValue(current.current);

            // Continue animation if not settled
            if (current.current !== target.current || velocity.current !== 0) {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [value]);

    return (
        <div className={`font-mono tracking-tighter tabular-nums ${className}`}>
            <span className="opacity-50 mr-1">{prefix}</span>
            {displayValue.toFixed(5)}
        </div>
    );
}
