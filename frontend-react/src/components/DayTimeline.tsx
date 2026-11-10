import { BOOKING_RULES } from '../bookingRules';
import type { Booking } from '../types';
import { cn } from '../utils/cn';
import {
    addMinutesToTime,
    formatTime,
    minutesToTime,
    timeOptions,
    timeToMinutes,
    todayInput,
} from '../utils/time';

const STEP = BOOKING_RULES.stepMinutes; // one grid row = 15 minutes
const SLOT_MINUTES = 30; // clickable free slots
const OPEN = timeToMinutes(BOOKING_RULES.openTime);
const CLOSE = timeToMinutes(BOOKING_RULES.closeTime);
const ROW_COUNT = (CLOSE - OPEN) / STEP; // 52 rows for 07:00–20:00

const HOURS = timeOptions(
    BOOKING_RULES.openTime,
    addMinutesToTime(BOOKING_RULES.closeTime, -60),
    60,
);
const SLOTS = timeOptions(
    BOOKING_RULES.openTime,
    addMinutesToTime(BOOKING_RULES.closeTime, -SLOT_MINUTES),
    SLOT_MINUTES,
);

/** ISO date-time -> minutes since local midnight. */
const minutesOfDay = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
};

/** Grid placement for a time range (minutes since midnight), clipped to opening hours. */
function rowPlacement(startMinutes: number, endMinutes: number) {
    const from = Math.max(startMinutes, OPEN);
    const to = Math.min(endMinutes, CLOSE);
    const firstLine = (from - OPEN) / STEP + 1; // grid lines are numbered from 1
    const rows = Math.max((to - from) / STEP, 1);
    return { gridRow: `${firstLine} / span ${rows}` };
}

interface DayTimelineProps {
    date: string; // "YYYY-MM-DD"
    bookings: Booking[];
    currentUserId: number;
    onSlotClick: (slot: string) => void;
}

export function DayTimeline({ date, bookings, currentUserId, onSlotClick }: DayTimelineProps) {
    // ----- Until when is this day in the past? -----
    const today = todayInput();
    let pastUntil = OPEN;
    if (date < today) {
        pastUntil = CLOSE;
    } else if (date === today) {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        // Round up to the next row, and keep it within opening hours.
        pastUntil = Math.min(Math.max(Math.ceil(nowMinutes / STEP) * STEP, OPEN), CLOSE);
    }

    // ----- Which half-hours can be clicked? -----
    const isBooked = (start: number, end: number) =>
        bookings.some((b) => minutesOfDay(b.start) < end && start < minutesOfDay(b.end));

    const freeSlots = SLOTS.filter((slot) => {
        const start = timeToMinutes(slot);
        return start >= pastUntil && !isBooked(start, start + SLOT_MINUTES);
    });

    return (
        <div
            className="grid grid-cols-[3.5rem_minmax(0,1fr)] pt-2 pb-2"
            style={{ gridTemplateRows: `repeat(${ROW_COUNT}, 1rem)` }}
        >
            {/* Hour labels, in the first column */}
            {HOURS.map((hour) => (
                <span
                    key={`label-${hour}`}
                    aria-hidden="true"
                    className="col-start-1 -mt-2 pr-3 text-right text-xs text-muted tabular-nums"
                    style={rowPlacement(timeToMinutes(hour), timeToMinutes(hour) + 60)}
                >
                    {hour}
                </span>
            ))}
            <span
                aria-hidden="true"
                className="col-start-1 -mb-2 self-end pr-3 text-right text-xs text-muted tabular-nums"
                style={{ gridRow: `${ROW_COUNT} / span 1` }}
            >
                {BOOKING_RULES.closeTime}
            </span>

            {/* Lines: solid at full hours, dashed at half hours, and one closing line */}
            {SLOTS.map((slot) => {
                const minutes = timeToMinutes(slot);
                return (
                    <div
                        key={`line-${slot}`}
                        aria-hidden="true"
                        className={cn(
                            'col-start-2 border-t',
                            minutes % 60 === 0
                                ? 'border-border-strong'
                                : 'border-dashed border-border',
                        )}
                        style={rowPlacement(minutes, minutes + SLOT_MINUTES)}
                    />
                );
            })}
            <div
                aria-hidden="true"
                className="col-start-2 border-b border-border-strong"
                style={{ gridRow: `${ROW_COUNT} / span 1` }}
            />

            {/* Past time, shaded */}
            {pastUntil > OPEN && (
                <div
                    aria-hidden="true"
                    className="col-start-2 bg-neutral-950/60"
                    style={rowPlacement(OPEN, pastUntil)}
                />
            )}

            {/* Free half-hours: invisible until hovered or focused */}
            {freeSlots.map((slot) => {
                const start = timeToMinutes(slot);
                const end = minutesToTime(start + SLOT_MINUTES);
                return (
                    <button
                        key={`slot-${slot}`}
                        type="button"
                        onClick={() => onSlotClick(slot)}
                        className="col-start-2 mx-1 my-px rounded-md px-3 text-left text-xs text-transparent transition-colors hover:bg-brand/10 hover:text-orange-300 focus-visible:text-orange-300"
                        style={rowPlacement(start, start + SLOT_MINUTES)}
                    >
                        + Book {slot}–{end}
                    </button>
                );
            })}

            {/* Bookings, drawn on top */}
            {bookings.map((booking) => {
                const own = booking.userId === currentUserId;
                return (
                    <div
                        key={booking.id}
                        className={cn(
                            'z-10 col-start-2 mx-1 my-px flex items-center overflow-hidden rounded-md border px-3 text-xs',
                            own
                                ? 'border-brand/60 bg-brand/20 text-orange-200'
                                : 'border-border-strong bg-neutral-800 text-neutral-300',
                        )}
                        style={rowPlacement(minutesOfDay(booking.start), minutesOfDay(booking.end))}
                    >
                        <span className="truncate">
                            {formatTime(booking.start)}–{formatTime(booking.end)} ·{' '}
                            {own ? booking.title : 'Booked'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
