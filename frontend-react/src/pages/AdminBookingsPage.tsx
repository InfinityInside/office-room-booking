import { useState } from 'react';
import {
    canCancelBooking,
    cancelBooking,
    getAllBookings,
    getRoom,
    getRooms,
    getUser,
} from '../api/mockApi';
import { useCurrentUser } from '../auth/AuthContext';
import { useRefresh } from '../hooks/useRefresh';
import type { Booking, BookingStatus } from '../types';
import { formatDate, formatTime, toDateInput } from '../utils/time';

type StatusFilter = 'ALL' | BookingStatus;

interface BookingFilters {
    date: string; // '' = any date
    roomId: string; // '' = any room
    status: StatusFilter;
    query: string; // matches title, name or email
}

const DEFAULT_FILTERS: BookingFilters = { date: '', roomId: '', status: 'ALL', query: '' };

export function AdminBookingsPage() {
    const user = useCurrentUser();
    const refresh = useRefresh();

    const [filters, setFilters] = useState<BookingFilters>(DEFAULT_FILTERS);
    const [message, setMessage] = useState<string | null>(null);

    // ----- Helpers -----
    const updateFilter = <K extends keyof BookingFilters>(key: K, value: BookingFilters[K]) => {
        setFilters((current) => ({ ...current, [key]: value }));
    };

    const personLabel = (userId: number) => {
        const person = getUser(userId);
        return person ? `${person.firstName} ${person.lastName} (${person.email})` : 'Unknown user';
    };

    // ----- Derived values -----
    const allBookings = getAllBookings(user);
    const query = filters.query.trim().toLowerCase();

    const shown = allBookings
        .filter((b) => filters.date === '' || toDateInput(new Date(b.start)) === filters.date)
        .filter((b) => filters.roomId === '' || b.roomId === Number(filters.roomId))
        .filter((b) => filters.status === 'ALL' || b.status === filters.status)
        .filter(
            (b) =>
                query === '' || `${b.title} ${personLabel(b.userId)}`.toLowerCase().includes(query),
        )
        .sort((a, b) => b.start.localeCompare(a.start)); // newest first

    // ----- Event handlers -----
    const handleCancel = (booking: Booking) => {
        if (!window.confirm(`Cancel "${booking.title}" by ${personLabel(booking.userId)}?`)) {
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
            <h1>All bookings</h1>

            <fieldset>
                <legend>Filters</legend>
                <p>
                    <label>
                        Date{' '}
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => updateFilter('date', e.target.value)}
                        />
                    </label>{' '}
                    <label>
                        Room{' '}
                        <select
                            value={filters.roomId}
                            onChange={(e) => updateFilter('roomId', e.target.value)}
                        >
                            <option value="">Any</option>
                            {getRooms().map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
                    </label>{' '}
                    <label>
                        Status{' '}
                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value as StatusFilter)}
                        >
                            <option value="ALL">All</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </label>
                </p>
                <p>
                    <label>
                        Search{' '}
                        <input
                            type="search"
                            value={filters.query}
                            onChange={(e) => updateFilter('query', e.target.value)}
                            placeholder="Title, name or email"
                        />
                    </label>{' '}
                    <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>
                        Reset filters
                    </button>
                </p>
            </fieldset>

            {message && <p role="status">{message}</p>}
            <p>
                Showing {shown.length} of {allBookings.length} bookings.
            </p>

            {shown.length === 0 ? (
                <p>No bookings match these filters.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Room</th>
                            <th>Booked by</th>
                            <th>Title</th>
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
                                <td>{personLabel(booking.userId)}</td>
                                <td>{booking.title}</td>
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
