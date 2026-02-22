import React from 'react';
import Card from './Card';
import Button from './Button';
import { Ghost } from 'lucide-react';

export default function EmptyState({
    icon = Ghost,
    title = "No Data Found",
    message = "There's nothing to show here right now.",
    actionText = "Go Back",
    onAction
}) {
    return (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2">
            <div className="w-16 h-16 bg-page rounded-full flex items-center justify-center mb-4 text-border">
                {React.createElement(icon, { size: 32 })}
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1">{title}</h2>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">{message}</p>
            {onAction && (
                <Button variant="primary" onClick={onAction}>{actionText}</Button>
            )}
        </Card>
    );
}
