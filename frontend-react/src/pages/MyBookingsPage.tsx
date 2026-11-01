import { formatDate, formatTime } from '../utils/time.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import type { Booking } from '../types.ts';
import { canCancelBooking, cancelBooking, getBookingsForUser, getRoom } from '../api/mockApi.ts';
import { useState } from 'react';
import { useRefresh } from '../hooks/useRefresh.ts';

type Tab = 'upcoming' | 'past';

export function MyBookingsPage() {
    const user = useCurrentUser();
    const refresh = useRefresh();

    const [tab, setTab] = useState<Tab>('upcoming');
    const [message, setMessage] = useState<string | null>(null);

    // ----- Derived values -----
    const now = new Date();
    const myBookings = getBookingsForUser(user.id).sort((a, b) => a.start.localeCompare(b.start));
    const upcoming = myBookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.end) > now);
    const past = myBookings.filter((b) => !upcoming.includes(b)).reverse(); // newest first
    const shown = tab === 'upcoming' ? upcoming : past;

    // ----- Event handlers -----
    const handleCancel = (booking: Booking) => {
        if (!window.confirm(`Cancel "${booking.title}"?`)) {
            return;
        }
        try {
            cancelBooking(booking.id, user);
            setMessage(`Cancelled "${booking.title}".`);
        } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Could not cancel the booking.');
        }
        refresh();
    };

    return (
        <>
            <h1>My bookings</h1>
            <p>
                <button
                    type="button"
                    disabled={tab === 'upcoming'}
                    onClick={() => setTab('upcoming')}
                >
                    Upcoming ({upcoming.length})
                </button>{' '}
                <button type="button" disabled={tab === 'past'} onClick={() => setTab('past')}>
                    Past and cancelled ({past.length})
                </button>
            </p>

            {message && <p role="status">{message}</p>}

            {shown.length === 0 ? (
                <p>
                    {tab === 'upcoming'
                        ? 'No upcoming bookings. Find a room to book one.'
                        : 'No past or cancelled bookings yet.'}
                </p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Room</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((booking) => (
                            <tr key={booking.id}>
                                <td>{formatDate(booking.start)}</td>
                                <td>
                                    {formatTime(booking.start)}–{formatTime(booking.end)}
                                </td>
                                <td>{getRoom(booking.roomId)?.name ?? 'Unknown room'}</td>
                                <td>{booking.title}</td>
                                <td>{booking.description}</td>
                                <td>
                                    {booking.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                                </td>
                                <td>
                                    {canCancelBooking(user, booking) && (
                                        <button type="button" onClick={() => handleCancel(booking)}>
                                            Cancel booking
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
