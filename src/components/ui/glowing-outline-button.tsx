import React from "react";

export const GlowingOutlineButton = ({
    children,
    className,
    onClick,
    disabled = false,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}) => {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`relative rounded-lg glowing_button text-white font-semibold px-6  py-2 ${className}`}
        >
            <span className="glowing-button_effect"></span>
            <span className="glowing-button_top_layer "></span>
            <span className="glowing-button_text opacity-90 z-50 relative font-semibold">
                {children}
            </span>
        </button>
    );
};
