"use client"

import React, { useState } from "react"
import { getAggressorType } from "@/lib/countryColors"

interface TankMarkerProps {
    name: string;
    sourceName?: string;
    sourceCountry?: string;
    angle: number;
    color?: string;
    intensity?: number;
    date?: string;
    sourceUrl?: string;
    onClick?: () => void;
}

export function TankMarker({
    name,
    sourceName,
    sourceCountry,
    angle,
    color = "#ef4444",
    intensity,
    date,
    sourceUrl,
    onClick
}: TankMarkerProps) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPopupOpen(!isPopupOpen);
        onClick?.();
    };

    const getIntensityLabel = (value?: number) => {
        if (value === undefined) return "Unknown";
        if (value <= -7) return "War Zone";
        if (value <= -5) return "Severe Conflict";
        if (value <= -2) return "Armed Conflict";
        if (value < 0) return "Tensions";
        return "Monitoring";
    };

    const getIntensityColor = (value?: number) => {
        if (value === undefined) return "bg-gray-500/30 text-gray-300";
        if (value <= -7) return "bg-red-600/40 text-red-300";
        if (value <= -5) return "bg-red-500/30 text-red-400";
        if (value <= -2) return "bg-orange-500/30 text-orange-400";
        if (value < 0) return "bg-yellow-500/30 text-yellow-400";
        return "bg-gray-500/30 text-gray-400";
    };

    const intensityLabel = getIntensityLabel(intensity);
    const aggressorType = getAggressorType(sourceName || "");

    // Normalize angle for tank rotation
    const tankRotation = angle;

    // Generate a unique filter ID for this color
    const filterId = `colorize-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 5)}`;

    // Parse color to RGB for the color matrix filter
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 0, b: 0 };
    };

    const rgb = hexToRgb(color);

    // Format date nicely
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Unknown";
        }
    };

    return (
        <g
            className="cursor-pointer"
            onClick={handleClick}
            style={{ pointerEvents: 'all' }}
        >
            {/* Define color filter for the PNG */}
            <defs>
                <filter id={filterId} colorInterpolationFilters="sRGB">
                    {/* Convert to grayscale */}
                    <feColorMatrix type="matrix"
                        values="0.33 0.33 0.33 0 0
                                0.33 0.33 0.33 0 0
                                0.33 0.33 0.33 0 0
                                0    0    0    1 0"/>
                    {/* Invert (black becomes white) */}
                    <feComponentTransfer>
                        <feFuncR type="table" tableValues="1 0" />
                        <feFuncG type="table" tableValues="1 0" />
                        <feFuncB type="table" tableValues="1 0" />
                    </feComponentTransfer>
                    {/* Apply the nation color */}
                    <feColorMatrix type="matrix"
                        values={`${rgb.r} 0 0 0 0
                                 0 ${rgb.g} 0 0 0
                                 0 0 ${rgb.b} 0 0
                                 0 0 0 1 0`} />
                </filter>
            </defs>

            {/* Tank image - just the colored icon, no background */}
            <g transform={`rotate(${tankRotation}) translate(-10, -6)`}>
                <image
                    href="/tank.png"
                    x="0"
                    y="0"
                    width="20"
                    height="12"
                    filter={`url(#${filterId})`}
                    style={{ pointerEvents: 'all' }}
                />
            </g>

            {/* Popup - same size as country popup (w-80 = 320px) */}
            {isPopupOpen && (
                <foreignObject x="-160" y="-280" width="320" height="270" style={{ overflow: 'visible' }}>
                    <div
                        className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/20 text-white rounded-xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - same style as country popup */}
                        <div className="p-4 border-b border-white/10 bg-black/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg" style={{ color }}>
                                        {sourceName || "Unknown Force"}
                                    </h3>
                                    <span className="text-xs text-gray-400">{aggressorType}</span>
                                </div>
                                <button
                                    className="text-gray-400 hover:text-white transition-colors text-xl leading-none p-1"
                                    onClick={(e) => { e.stopPropagation(); setIsPopupOpen(false); }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-red-400 text-sm">
                                    ⚔️ Attack on {name}
                                </span>
                            </div>
                        </div>

                        {/* Conflict Details - same style as country popup conflict cards */}
                        <div className="p-3">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-bold text-sm" style={{ color }}>
                                        Conflict Details
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] ${getIntensityColor(intensity)}`}>
                                        {intensity !== undefined && intensity <= -5 ? 'SEVERE' :
                                            intensity !== undefined && intensity < 0 ? 'CONFLICT' : 'TENSION'}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-gray-400">
                                    <div className="flex justify-between">
                                        <span>Aggressor:</span>
                                        <span className="text-white font-medium" style={{ color }}>
                                            {sourceName || "Unknown"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Target:</span>
                                        <span className="text-white">{name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Severity:</span>
                                        <span className="text-white">{intensityLabel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Reported:</span>
                                        <span className="text-white">
                                            {date ? formatDate(date) : "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                {sourceUrl && (
                                    <a
                                        href={sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 block text-blue-400 hover:text-blue-300 text-[10px]"
                                    >
                                        → Read source
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </foreignObject>
            )}
        </g>
    )
}
