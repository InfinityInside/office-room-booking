import { cn } from '../utils/cn.ts';
import { Select } from './ui/Select.tsx';

interface TimeSelectProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    className?: string;
}

/** A dropdown of "HH:mm" times.*/
export function TimeSelect({ value, options, onChange, className }: TimeSelectProps) {
    return (
        <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn('tabular-nums', className)}
        >
            {options.map((time) => (
                <option key={time} value={time}>
                    {time}
                </option>
            ))}
        </Select>
    );
}
