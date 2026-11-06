import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

/** The standard container: a dark panel with a thin border. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={cn('rounded-xl border border-border bg-surface/80 p-6', className)}
            {...props}
        />
    );
}
