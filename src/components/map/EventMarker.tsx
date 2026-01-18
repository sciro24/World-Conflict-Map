"use client"

import React from "react"

interface EventMarkerProps {
    eventType: "conflict" | "protest" | "cyber" | "terrorism";
    color: string;
    size?: number;
    onClick?: (e: React.MouseEvent) => void;
}

// Event type icons (simple symbols)
const EVENT_ICONS: Record<string, string> = {
    conflict: "⚔", // Swords for conflict
    protest: "✊", // Fist for protest
    cyber: "💻", // Computer for cyber
    terrorism: "💀", // Skull for terrorism
};

export function EventMarker({
    eventType,
    color,
    size = 10,
    onClick
}: EventMarkerProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(e);
    };

    return (
        <g
            className="cursor-pointer"
            onClick={handleClick}
            style={{ pointerEvents: 'all' }}
        >
            {/* Marker pin/dot */}
            <circle
                r={size}
                fill={color}
                stroke="#000"
                strokeWidth="1.5"
                opacity="0.9"
            />

            {/* Inner dot for contrast */}
            <circle
                r={size * 0.4}
                fill="#fff"
                opacity="0.3"
            />

            {/* Pulsing animation for active events */}
            <circle r={size} fill={color} opacity="0">
                <animate
                    attributeName="r"
                    values={`${size};${size * 2};${size}`}
                    dur="2s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </circle>
        </g>
    )
}
