export default function ProgressBar({ value = 0, colorClass = "bg-brand", className = "" }) {
    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div className={`w-full bg-page rounded-full h-1.5 overflow-hidden border border-border/50 ${className}`}>
            <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${clampedValue}%` }}
            />
        </div>
    );
}
