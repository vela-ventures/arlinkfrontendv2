interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className = "",
  size = 300,
  duration = 10,
  borderWidth = 2,
  anchor = 0,
  colorFrom = "#ffffff",
  colorTo = "#71717a",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={`border-beam ${className}`}
      style={{
        "--border-beam-size": `${size}px`,
        "--border-beam-duration": `${duration}s`,
        "--border-beam-border-width": `${borderWidth}px`,
        "--border-beam-anchor": anchor,
        "--border-beam-color-from": colorFrom,
        "--border-beam-color-to": colorTo,
        "--border-beam-delay": `${delay}s`,
      } as React.CSSProperties}
    />
  );
} 