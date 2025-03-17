"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AnimatedDots({
    children,
}: {
    children: React.ReactNode;
}) {
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex">
            <span>{children}</span>
            <span className="flex">
                {[0, 1, 2].map((index) => (
                    <motion.span
                        key={index}
                        animate={{ opacity: index < dotCount ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        .
                    </motion.span>
                ))}
            </span>
        </div>
    );
}
