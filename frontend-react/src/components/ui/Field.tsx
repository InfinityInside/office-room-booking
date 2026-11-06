import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface FieldProps {
    label: string;
    hint?: string;
    error?: string | null;
    className?: string;
    children: ReactNode;
}

/** A label with its control, and an optional hint or error below it. */
export function Field({ label, hint, error, className, children }: FieldProps) {
    return (
        <label className={cn('flex flex-col gap-1.5', className)}>
            <span className="text-sm font-medium text-neutral-300">{label}</span>
            {children}
            {error ? (
                <span className="text-xs text-red-400">{error}</span>
            ) : (
                hint && <span className="text-xs text-neutral-400">{hint}</span>
            )}
        </label>
    );
}
