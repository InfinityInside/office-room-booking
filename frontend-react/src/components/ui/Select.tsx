import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { CONTROL_CLASSES } from './controlClasses';

export function Select({ className, ...props }: ComponentProps<'select'>) {
    return <select className={cn(CONTROL_CLASSES, className)} {...props} />;
}
