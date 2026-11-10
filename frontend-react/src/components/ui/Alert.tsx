import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type AlertTone = 'error' | 'success';

const TONE_CLASSES: Record<AlertTone, string> = {
    error: 'bg-red-500/10 text-red-300',
    success: 'bg-emerald-500/10 text-emerald-300',
};

interface AlertProps {
    tone: AlertTone;
    className?: string;
    children: ReactNode;
}

/** A tinted message box. */
export function Alert({ tone, className, children }: AlertProps) {
    return (
        <p
            role={tone === 'error' ? 'alert' : 'status'}
            className={cn(
                'rounded-lg px-3 py-2 text-sm wrap-break-word',
                TONE_CLASSES[tone],
                className,
            )}
        >
            {children}
        </p>
    );
}
