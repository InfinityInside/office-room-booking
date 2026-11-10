import { formatDate, formatDateParts, formatTime } from '../utils/time.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import type { Booking } from '../types.ts';
import { canCancelBooking, cancelBooking, getBookingsForUser, getRoom } from '../api/mockApi.ts';
import { useState } from 'react';
import { useRefresh } from '../hooks/useRefresh.ts';
import { cn } from '../utils/cn.ts';
import { Alert } from '../components/ui/Alert.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Link } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';

type Tab = 'upcoming' | 'past';
type DisplayStatus = 'upcoming' | 'now' | 'completed' | 'cancelled';

const TABS: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past and cancelled' },
];

const STATUS_BADGES: Record<
    DisplayStatus,
    { label: string; tone: 'brand' | 'neutral' | 'danger' } | null
> = {
    upcoming: null, // the normal case needs no badge
    now: { label: 'Happening now', tone: 'brand' },
    completed: { label: 'Completed', tone: 'neutral' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
};

interface Notice {
    tone: 'success' | 'error';
    text: string;
}

export function MyBookingsPage() {
    const user = useCurrentUser();
    const refresh = useRefresh();

    const [tab, setTab] = useState<Tab>('upcoming');
    const [notice, setNotice] = useState<Notice | null>(null);
    const [toCancel, setToCancel] = useState<Booking | null>(null); // null = dialog closed

    const now = new Date();

    const statusOf = (booking: Booking): DisplayStatus => {
        if (booking.status === 'CANCELLED') {
            return 'cancelled';
        }
        if (new Date(booking.end) <= now) {
            return 'completed';
        }
        return new Date(booking.start) <= now ? 'now' : 'upcoming';
    };

    const myBookings = getBookingsForUser(user.id).sort((a, b) => a.start.localeCompare(b.start));
    const upcoming = myBookings.filter((b) => statusOf(b) === 'upcoming' || statusOf(b) === 'now');
    const past = myBookings.filter((b) => !upcoming.includes(b)).reverse(); // newest first
    const shown = tab === 'upcoming' ? upcoming : past;
    const counts: Record<Tab, number> = { upcoming: upcoming.length, past: past.length };


    const confirmCancel = () => {
        if (!toCancel) {
            return;
        }
        try {
            cancelBooking(toCancel.id, user);
            setNotice({ tone: 'success', text: `Cancelled "${toCancel.title}".` });
        } catch (e) {
            setNotice({
                tone: 'error',
                text: e instanceof Error ? e.message : 'Could not cancel the booking.',
            });
        }
        setToCancel(null);
        refresh();
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-semibold tracking-tight">My bookings</h1>
                    <p className="text-sm text-muted">
                        Your upcoming meetings and booking history.
                    </p>
                </div>

                <div className="inline-flex rounded-lg border border-border bg-neutral-950/60 p-1">
                    {TABS.map((item) => {
                        const selected = tab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setTab(item.id)}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                    selected
                                        ? 'bg-neutral-800 text-neutral-100'
                                        : 'text-muted hover:text-neutral-100',
                                )}
                            >
                                {item.label}
                                <span className="rounded-full bg-neutral-700/60 px-1.5 text-xs tabular-nums">
                                    {counts[item.id]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

            {shown.length === 0 ? (
                <Card className="py-12 text-center">
                    <p className="font-medium">
                        {tab === 'upcoming'
                            ? 'No upcoming bookings'
                            : 'No past or cancelled bookings yet'}
                    </p>
                    {tab === 'upcoming' && (
                        <Link
                            to="/rooms"
                            className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-hover"
                        >
                            Find a room
                        </Link>
                    )}
                </Card>
            ) : (
                <ul className="flex flex-col gap-3">
                    {shown.map((booking) => {
                        const status = statusOf(booking);
                        const badge = STATUS_BADGES[status];
                        const date = formatDateParts(booking.start);
                        const room = getRoom(booking.roomId);

                        return (
                            <li key={booking.id}>
                                <Card className="flex flex-wrap items-center gap-4 p-4">
                                    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-neutral-800 leading-none">
                                        <span className="text-xs text-muted">{date.month}</span>
                                        <span className="mt-1 text-xl font-semibold tabular-nums">
                                            {date.day}
                                        </span>
                                    </div>

                                    <div className="flex min-w-48 flex-1 flex-col gap-0.5">
                                        <p
                                            className={cn(
                                                'truncate font-medium',
                                                status === 'cancelled' && 'text-muted line-through',
                                            )}
                                        >
                                            {booking.title}
                                        </p>
                                        <p className="text-sm text-muted">
                                            {date.weekday} · {formatTime(booking.start)}–
                                            {formatTime(booking.end)} ·{' '}
                                            {room ? (
                                                <Link
                                                    to={`/rooms/${room.id}`}
                                                    className="text-neutral-300 hover:text-brand"
                                                >
                                                    {room.name}
                                                </Link>
                                            ) : (
                                                'Unknown room'
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
                                        {canCancelBooking(user, booking) && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setNotice(null);
                                                    setToCancel(booking);
                                                }}
                                            >
                                                Cancel booking
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            )}

            <ConfirmDialog
                open={toCancel !== null}
                title="Cancel this booking?"
                description={
                    toCancel && (
                        <>
                            "{toCancel.title}" on {formatDate(toCancel.start)},{' '}
                            {formatTime(toCancel.start)}–{formatTime(toCancel.end)}, will be
                            cancelled, and the room becomes free for others.
                        </>
                    )
                }
                confirmLabel="Cancel booking"
                cancelLabel="Keep booking"
                tone="danger"
                onConfirm={confirmCancel}
                onCancel={() => setToCancel(null)}
            />
        </div>
    );
}
