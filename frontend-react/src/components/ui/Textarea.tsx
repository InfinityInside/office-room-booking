import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { CONTROL_CLASSES } from './controlClasses';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
    return (
        <textarea className={cn(CONTROL_CLASSES, 'h-auto min-h-24 py-2', className)} {...props} />
    );
}
