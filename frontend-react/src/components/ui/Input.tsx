import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { CONTROL_CLASSES } from './controlClasses';

export function Input({ className, ...props }: ComponentProps<'input'>) {
    return <input className={cn(CONTROL_CLASSES, className)} {...props} />;
}
