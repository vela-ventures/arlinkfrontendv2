"use client";

import type React from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";

const AnimatedCloneTemplate: React.FC = () => {
    const speeds = useMemo(
        () => [
            Math.random() * 1.5 + 1.5,
            Math.random() * 1.5 + 1.5,
            Math.random() * 1.5 + 1.5,
        ],
        [],
    );

    const createLineVariants = (duration: number) => ({
        initial: { pathLength: 0, pathOffset: 0 },
        animate: {
            pathLength: 0.2,
            pathOffset: 1,
            transition: {
                duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
            },
        },
    });

    return (
        <motion.svg
            animate={{ y: [0, -5, 0] }}
            transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
            }}
            width="394"
            height="141"
            viewBox="0 0 394 141"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Darker background */}
            <rect width="394" height="141" fill="#050505" />

            {/* Animated lines with glow effect */}
            <g filter="url(#glow)">
                <path
                    d="M117.1 21.7861H174.716L196.766 44.9339H260.072"
                    stroke="#333333"
                    strokeWidth="1.36163"
                />
                <motion.path
                    d="M117.1 21.7861H174.716L196.766 44.9339H260.072"
                    stroke="white"
                    strokeWidth="1.36163"
                    initial="initial"
                    animate="animate"
                    variants={createLineVariants(speeds[0])}
                />

                <line
                    x1="123.228"
                    y1="67.4002"
                    x2="253.944"
                    y2="67.4002"
                    stroke="#333333"
                    strokeWidth="1.36163"
                />
                <motion.line
                    x1="123.228"
                    y1="67.4002"
                    x2="253.944"
                    y2="67.4002"
                    stroke="white"
                    strokeWidth="1.36163"
                    initial="initial"
                    animate="animate"
                    variants={createLineVariants(speeds[1])}
                />

                <path
                    d="M117.1 114.378H174.716L196.766 91.2302H260.072"
                    stroke="#333333"
                    strokeWidth="1.36163"
                />
                <motion.path
                    d="M117.1 114.378H174.716L196.766 91.2302H260.072"
                    stroke="white"
                    strokeWidth="1.36163"
                    initial="initial"
                    animate="animate"
                    variants={createLineVariants(speeds[2])}
                />
            </g>

            {/* Folder icon */}
            <g>
                <rect
                    x="0.824988"
                    y="0.824988"
                    width="138.598"
                    height="138.598"
                    rx="69.299"
                    fill="#080808"
                    stroke="#2E2E2E"
                    strokeWidth="1.64998"
                />
                <path
                    d="M69.5848 94.9721H66.5693C55.194 94.9721 49.5064 94.9721 45.9718 90.5865C42.4373 86.201 42.4373 79.1432 42.4373 65.0276V55.882C42.4373 50.4439 42.4373 47.7235 43.3564 45.6839C43.9552 44.2959 44.92 43.0967 46.1477 42.2146C47.793 41.0742 49.9858 41.0742 54.3686 41.0742C57.1769 41.0742 58.5811 41.0742 59.8094 41.6472C62.6178 42.9521 63.7752 46.1151 65.0403 49.2582L66.5693 53.0509M56.6323 53.0509H80.8721C85.9556 53.0509 88.4973 53.0509 90.3241 54.5657C91.1127 55.2182 91.7936 56.0635 92.3212 57.045C93.1438 58.5712 93.4105 60.503 93.4984 63.5326"
                    stroke="white"
                    strokeWidth="4.2551"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M49.8013 71.0752C51.0211 67.8129 51.6366 66.1847 52.8281 65.1606C54.757 63.5096 57.5285 63.7848 59.9029 63.7848H85.703C92.7295 63.7848 96.2442 63.7848 97.9973 66.0457C101.004 69.9263 97.4555 76.221 96.0258 80.0307C93.4614 86.8616 92.1792 90.277 89.6262 92.3592C85.737 95.5335 80.0777 94.9236 75.3829 94.9236H64.9523C54.9017 94.9236 49.8779 94.9236 47.2624 91.8145C42.44 86.0701 47.6312 76.8536 49.8013 71.0723"
                    stroke="white"
                    strokeWidth="4.2551"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>

            {/* GitHub icon */}
            <g>
                <rect
                    x="254.089"
                    y="0.824988"
                    width="138.598"
                    height="138.598"
                    rx="69.299"
                    fill="#080808"
                    stroke="#2E2E2E"
                    strokeWidth="1.64998"
                />
                <path
                    d="M322.707 36.7646C318.237 36.7646 313.81 37.649 309.68 39.3671C305.55 41.0852 301.797 43.6035 298.636 46.7781C292.252 53.1897 288.666 61.8856 288.666 70.9528C288.666 86.064 298.436 98.8846 311.95 103.432C313.652 103.705 314.197 102.645 314.197 101.722V95.9444C304.767 97.9957 302.759 91.3632 302.759 91.3632C301.193 87.3974 298.98 86.3375 298.98 86.3375C295.883 84.2179 299.219 84.2862 299.219 84.2862C302.623 84.5256 304.427 87.8076 304.427 87.8076C307.388 93.0042 312.392 91.4658 314.333 90.6452C314.639 88.423 315.524 86.9187 316.477 86.064C308.92 85.2093 300.989 82.2691 300.989 69.2434C300.989 65.4485 302.282 62.4058 304.495 59.9784C304.155 59.1237 302.963 55.5682 304.835 50.9528C304.835 50.9528 307.695 50.0297 314.197 54.4399C316.886 53.6878 319.813 53.3117 322.707 53.3117C325.6 53.3117 328.528 53.6878 331.217 54.4399C337.719 50.0297 340.578 50.9528 340.578 50.9528C342.45 55.5682 341.259 59.1237 340.919 59.9784C343.131 62.4058 344.425 65.4485 344.425 69.2434C344.425 82.3033 336.459 85.1751 328.868 86.0298C330.094 87.0897 331.217 89.1752 331.217 92.3547V101.722C331.217 102.645 331.762 103.739 333.498 103.432C347.012 98.8504 356.748 86.064 356.748 70.9528C356.748 66.4632 355.867 62.0175 354.156 57.8696C352.446 53.7217 349.938 49.9528 346.777 46.7781C343.616 43.6035 339.864 41.0852 335.734 39.3671C331.604 37.649 327.177 36.7646 322.707 36.7646Z"
                    fill="white"
                />
            </g>

            {/* Glow filter */}
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </motion.svg>
    );
};

export default AnimatedCloneTemplate;
