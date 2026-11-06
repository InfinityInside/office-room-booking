import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

type BadgeTone = 'neutral' | 'brand' | 'danger';

const TONE_CLASSES: Record<BadgeTone, string> = {
    neutral: 'bg-neutral-800 text-neutral-300',
    brand: 'bg-brand/15 text-orange-300',
    danger: 'bg-red-500/15 text-red-300',
};

interface BadgeProps extends ComponentProps<'span'> {
    tone?: BadgeTone;
}

/** A small status label, e.g. "Free", "Booked", "Cancelled". */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                TONE_CLASSES[tone],
                className,
            )}
            {...props}
        />
    );
}
