import type { Booking } from '../types';

export type DisplayStatus = 'upcoming' | 'now' | 'completed' | 'cancelled';

export const STATUS_BADGES: Record<
    DisplayStatus,
    { label: string; tone: 'brand' | 'neutral' | 'danger' } | null
> = {
    upcoming: null, // the normal case needs no badge
    now: { label: 'Happening now', tone: 'brand' },
    completed: { label: 'Completed', tone: 'neutral' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
};

/** How a booking should be presented at the given moment. */
export function displayStatusOf(booking: Booking, now: Date): DisplayStatus {
    if (booking.status === 'CANCELLED') {
        return 'cancelled';
    }
    if (new Date(booking.end) <= now) {
        return 'completed';
    }
    return new Date(booking.start) <= now ? 'now' : 'upcoming';
}
