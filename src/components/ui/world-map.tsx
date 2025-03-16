//@ts-nocheck

"use client";

import { useMemo, useRef, useState } from "react";
import DottedMap from "dotted-map";
import { countryCoordinates } from "@/lib/utils";
import { motion } from "framer-motion";

interface CountryDot {
    visitor: number;
    country: string;
    percentage: number;
}

interface CountryMapProps {
    dots?: CountryDot[];
    baseColor?: string;
}

// Create the map instance outside the component to prevent recreation on each render
const mapInstance = new DottedMap({ height: 100, grid: "diagonal" });
const baseSvgMap = mapInstance.getSVG({
    radius: 0.22,
    color: "#FFFFFF40",
    shape: "circle",
    backgroundColor: "transparent",
});

function CountryMap({ dots = [], baseColor = "#ffffff" }: CountryMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredDot, setHoveredDot] = useState<
        (CountryDot & { x: number; y: number }) | null
    >(null);

    // Memoize the SVG string to prevent recalculation
    const svgMap = useMemo(() => baseSvgMap, []);

    // Memoize the projection function
    const projectPoint = useMemo(() => {
        return (lat: number, lng: number) => {
            const x = (lng + 180) * (800 / 360);
            const y = (90 - lat) * (400 / 180);
            return { x, y };
        };
    }, []);

    // Convert percentage to brightness (opacity)
    const getBrightness = (percentage: number) => {
        // Ensure percentage is between 0 and 100
        const validPercentage = Math.max(0, Math.min(100, percentage));

        // Scale from 0.1 (10%) to 1.0 (100%)
        return 0.1 + (validPercentage / 100) * 0.9;
    };

    // Process the country dots
    const processedDots = useMemo(() => {
        return dots
            .map((dot) => {
                const countryName = dot.country.toLowerCase();
                const coords = countryCoordinates[countryName];

                if (!coords) {
                    console.warn(
                        `Coordinates not found for country: ${dot.country}`,
                    );
                    return null;
                }

                return {
                    ...dot,
                    position: projectPoint(coords.lat, coords.lng),
                    brightness: getBrightness(dot.percentage),
                };
            })
            .filter(Boolean);
    }, [dots, projectPoint]);

    const handleMouseEnter = (dot) => {
        console.log(dot);
        setHoveredDot({
            ...dot,
            x: dot.position.x,
            y: dot.position.y,
        });
    };

    const handleMouseLeave = () => {
        setHoveredDot(null);
    };

    return (
        <div className="w-full aspect-[2/1] rounded-lg relative font-sans">
            <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
                className="h-full w-full pointer-events-none select-none"
                alt="world map"
                height="495"
                width="1056"
                draggable={false}
            />
            <svg
                ref={svgRef}
                viewBox="0 0 800 400"
                className="w-full h-full absolute inset-0"
            >
                {processedDots.map((dot, i) => (
                    <g
                        key={`dot-${i}`}
                        className="relative cursor-pointer"
                        onMouseEnter={() => handleMouseEnter(dot)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Main dot */}
                        <circle
                            cx={dot.position.x}
                            cy={dot.position.y}
                            r="3"
                            fill={baseColor}
                            opacity={dot.brightness}
                        />

                        {/* Pulsing effect */}
                        <circle
                            cx={dot.position.x}
                            cy={dot.position.y}
                            r="3"
                            fill={baseColor}
                            opacity={dot.brightness * 0.5}
                        >
                            <animate
                                attributeName="r"
                                from="3"
                                to="10"
                                dur="1.5s"
                                begin="0s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="opacity"
                                from={dot.brightness * 0.5}
                                to="0"
                                dur="1.5s"
                                begin="0s"
                                repeatCount="indefinite"
                            />
                        </circle>

                        {/* Larger invisible circle for better hover area */}
                        <circle
                            cx={dot.position.x}
                            cy={dot.position.y}
                            r="15"
                            fill="transparent"
                        />
                    </g>
                ))}
            </svg>

            {hoveredDot && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute translate-y-4 top-0 right-0 bg-black/50 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm border border-white/10 w-64 transition-opacity duration-200"
                >
                    <h3 className="text-sm font-semibold mb-2">
                        {hoveredDot.country}
                    </h3>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Visitors:</span>
                            <span className="font-medium">
                                {hoveredDot.visitors}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Percentage:</span>
                            <span className="font-medium">
                                {hoveredDot.percentange}%
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default CountryMap;
