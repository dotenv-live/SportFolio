export default function Badge({ variant = "neutral", children, className = "" }) {
    const variants = {
        success: "bg-success-light text-success",
        danger: "bg-danger-light text-danger",
        brand: "bg-brand-light text-brand",
        gold: "bg-gold-light text-gold",
        neutral: "bg-gray-100 text-gray-500",
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        >
            {children}
        </span>
    );
}
