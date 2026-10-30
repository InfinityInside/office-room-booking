const pad = (n: number) => String(n).padStart(2, '0');

/** Date -> "YYYY-MM-DD" in local time (the format <input type="date"> uses). */
export function toDateInput(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayInput(): string {
    return toDateInput(new Date());
}

/** "YYYY-MM-DD" + "HH:mm" -> Date in local time. */
export function combine(dateInput: string, time: string): Date {
    return new Date(`${dateInput}T${time}`);
}

/** "2026-10-28" + 1 -> "2026-10-29" */
export function addDays(dateInput: string, days: number): string {
    const date = combine(dateInput, '12:00');
    date.setDate(date.getDate() + days);
    return toDateInput(date);
}

/** Two time ranges overlap if each one starts before the other ends. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && bStart < aEnd;
}
