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

/** "09:30" -> 570 (minutes since midnight) */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/** 570 -> "09:30" */
export function minutesToTime(totalMinutes: number): string {
    return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/** "09:30" + 30 -> "10:00" (negative minutes go back in time) */
export function addMinutesToTime(time: string, minutes: number): string {
    return minutesToTime(timeToMinutes(time) + minutes);
}

/** All times from `from` to `to`, inclusive: ("07:00", "08:00", 30) -> ["07:00", "07:30", "08:00"] */
export function timeOptions(from: string, to: string, stepMinutes: number): string[] {
    const options: string[] = [];
    for (let m = timeToMinutes(from); m <= timeToMinutes(to); m += stepMinutes) {
        options.push(minutesToTime(m));
    }
    return options;
}

/** "2026-10-30" -> "Friday, 30 October 2026" */
export function formatLongDate(dateInput: string): string {
    return combine(dateInput, '12:00').toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
