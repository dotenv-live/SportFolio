export default function Tag({ children, className = "" }) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded bg-page border border-border text-text-secondary text-xs font-medium ${className}`}
        >
            {children}
        </span>
    );
}
