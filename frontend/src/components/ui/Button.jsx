export default function Button({
    variant = "primary",
    size = "md",
    children,
    className = "",
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-brand text-white hover:bg-brand-dark",
        outline: "border border-brand text-brand hover:bg-brand-light",
        ghost: "text-text-secondary hover:bg-page hover:text-text-primary",
        success: "bg-success text-white hover:bg-success/90",
        danger: "bg-danger text-white hover:bg-danger/90",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
