import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

interface ChipProps extends ComponentProps<'button'> {
    selected: boolean;
}

/** A pill-shaped toggle button, e.g. for filters or picking several options. */
export function Chip({ selected, className, ...props }: ChipProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            className={cn(
                'h-9 rounded-full border px-3.5 text-sm transition-colors',
                selected
                    ? 'border-brand bg-brand/15 text-orange-300'
                    : 'border-border-strong text-neutral-300 hover:border-neutral-500 hover:text-neutral-100',
                className,
            )}
            {...props}
        />
    );
}
