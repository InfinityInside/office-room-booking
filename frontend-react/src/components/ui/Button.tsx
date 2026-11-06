import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'md' | 'sm';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: 'bg-brand text-neutral-950 enabled:hover:bg-brand-hover',
    secondary: 'border border-neutral-700 text-neutral-100 enabled:hover:bg-neutral-800',
    danger: 'bg-red-600 text-white enabled:hover:bg-red-500',
    ghost: 'text-neutral-300 enabled:hover:bg-neutral-800 enabled:hover:text-neutral-100',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    md: 'h-11 px-5',
    sm: 'h-9 px-3',
};

interface ButtonProps extends ComponentProps<'button'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export function Button({
    variant = 'secondary',
    size = 'md',
    type = 'button',
    className,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                VARIANT_CLASSES[variant],
                SIZE_CLASSES[size],
                className,
            )}
            {...props}
        />
    );
}
