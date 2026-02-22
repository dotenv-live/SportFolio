export default function Card({ children, noPadding = false, className = "" }) {
    return (
        <div
            className={`bg-surface rounded-xl border border-border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${noPadding ? "" : "p-4 sm:p-5"
                } ${className}`}
        >
            {children}
        </div>
    );
}
