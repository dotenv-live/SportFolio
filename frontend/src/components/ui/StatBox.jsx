import Card from "./Card";

export default function StatBox({ label, value, change, changeType = "neutral", className = "" }) {
    const changeColors = {
        up: "text-success",
        down: "text-danger",
        neutral: "text-text-secondary",
    };

    return (
        <Card className={className}>
            <div className="flex flex-col">
                <span className="text-text-secondary text-xs uppercase tracking-wide font-medium mb-1">
                    {label}
                </span>
                <div className="flex items-baseline space-x-2">
                    <span className="text-text-primary font-bold text-xl">{value}</span>
                    {change && (
                        <span className={`text-xs font-medium flex items-center ${changeColors[changeType]}`}>
                            {changeType === "up" && (
                                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            )}
                            {changeType === "down" && (
                                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                            {change}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
}
