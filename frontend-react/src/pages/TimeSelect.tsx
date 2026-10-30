interface TimeSelectProps {
    value: string;
    options: string[];
    onChange: (value: string) => void;
}

/** A dropdown of "HH:mm" times.*/
export function TimeSelect({ value, options, onChange }: TimeSelectProps) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((time) => (
                <option key={time} value={time}>
                    {time}
                </option>
            ))}
        </select>
    );
}
