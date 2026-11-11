import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

/** A data table in a bordered frame that scrolls sideways on narrow screens. */
export function Table({ className, ...props }: ComponentProps<'table'>) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface/80">
            <table className={cn('w-full text-left text-sm', className)} {...props} />
        </div>
    );
}

/** A column header cell. */
export function Th({ className, ...props }: ComponentProps<'th'>) {
    return (
        <th
            scope="col"
            className={cn(
                'border-b border-border px-4 py-3 text-xs font-medium whitespace-nowrap text-muted',
                className,
            )}
            {...props}
        />
    );
}

/** A data cell. */
export function Td({ className, ...props }: ComponentProps<'td'>) {
    return <td className={cn('px-4 py-3 align-middle', className)} {...props} />;
}
