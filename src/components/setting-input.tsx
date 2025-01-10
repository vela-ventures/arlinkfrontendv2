"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface SettingInputProps {
    label: string;
    placeholder: string;
    value: string;
    enabled: boolean;
    onValueChange: (value: string) => void;
    onEnabledChange: (enabled: boolean) => void;
    className?: string;
    disabled?: boolean;
}

export function SettingInput({
    label,
    placeholder,
    value,
    enabled,
    onValueChange,
    onEnabledChange,
    className,
    disabled,
}: SettingInputProps) {
    return (
        <div>
            <p className="mb-3 font-medium text-sm">{label}</p>
            <div className="relative">
                <div className="flex items-center absolute right-2 z-10 top-1/2 -translate-y-1/2 justify-between">
                    <Switch
                        checked={enabled}
                        onCheckedChange={onEnabledChange}
                        disabled={disabled}
                    />
                </div>
                <Input
                    placeholder={placeholder}
                    value={value}
                    disabled={disabled || !enabled}
                    onChange={(e) => onValueChange(e.target.value)}
                    className={`bg-[#0C0C0C] border-[#383838] text-white pr-14 ${className}`}
                />
            </div>
        </div>
    );
}
