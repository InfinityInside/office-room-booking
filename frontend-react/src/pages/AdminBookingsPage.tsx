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
import { formatDate, formatDateParts, formatTime, toDateInput } from '../utils/time';
import { Alert, type Notice } from '../components/ui/Alert.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Field } from '../components/ui/Field.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Select } from '../components/ui/Select.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Table, Td, Th } from '../components/ui/Table.tsx';
import { displayStatusOf, STATUS_BADGES } from '../utils/bookingStatus.ts';
import { Badge } from '../components/ui/Badge.tsx';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';

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
    const [notice, setNotice] = useState<Notice | null>(null);
    const [toCancel, setToCancel] = useState<Booking | null>(null); // null = dialog closed

    // ----- Helpers -----
    const updateFilter = <K extends keyof BookingFilters>(key: K, value: BookingFilters[K]) => {
        setFilters((current) => ({ ...current, [key]: value }));
    };

    const personOf = (userId: number) => {
        const person = getUser(userId);
        return person
            ? { name: `${person.firstName} ${person.lastName}`, email: person.email }
            : { name: 'Unknown user', email: '' };
    };

    // ----- Derived values -----
    const now = new Date();
    const allBookings = getAllBookings(user);
    const query = filters.query.trim().toLowerCase();

    const shown = allBookings
        .filter((b) => filters.date === '' || toDateInput(new Date(b.start)) === filters.date)
        .filter((b) => filters.roomId === '' || b.roomId === Number(filters.roomId))
        .filter((b) => filters.status === 'ALL' || b.status === filters.status)
        .filter((b) => {
            if (query === '') {
                return true;
            }
            const person = personOf(b.userId);
            return `${b.title} ${person.name} ${person.email}`.toLowerCase().includes(query);
        })
        .sort((a, b) => b.start.localeCompare(a.start)); // newest first

    // ----- Event handlers -----
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
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-semibold tracking-tight">All bookings</h1>
                <p className="text-sm text-muted">
                    Everyone's bookings. Admins can cancel any upcoming one.
                </p>
            </div>

            <Card>
                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,2fr)_auto]">
                    <Field label="Date">
                        <Input
                            type="date"
                            value={filters.date}
                            onChange={(e) => updateFilter('date', e.target.value)}
                        />
                    </Field>
                    <Field label="Room">
                        <Select
                            value={filters.roomId}
                            onChange={(e) => updateFilter('roomId', e.target.value)}
                        >
                            <option value="">Any</option>
                            {getRooms().map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Status">
                        <Select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value as StatusFilter)}
                        >
                            <option value="ALL">All</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </Select>
                    </Field>
                    <Field label="Search">
                        <Input
                            type="search"
                            value={filters.query}
                            onChange={(e) => updateFilter('query', e.target.value)}
                            placeholder="Title, name or email"
                        />
                    </Field>
                    <Button onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</Button>
                </div>
            </Card>

            {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

            <p className="text-sm text-muted">
                Showing {shown.length} of {allBookings.length} bookings.
            </p>

            {shown.length === 0 ? (
                <Card className="py-12 text-center">
                    <p className="font-medium">No bookings match these filters</p>
                    <p className="mt-1 text-sm text-muted">
                        Try another date, or reset the filters.
                    </p>
                </Card>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <Th>Date</Th>
                            <Th>Time</Th>
                            <Th>Room</Th>
                            <Th>Booked by</Th>
                            <Th>Title</Th>
                            <Th>Status</Th>
                            <Th>
                                <span className="sr-only">Actions</span>
                            </Th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((booking) => {
                            const date = formatDateParts(booking.start);
                            const person = personOf(booking.userId);
                            const badge = STATUS_BADGES[displayStatusOf(booking, now)];

                            return (
                                <tr
                                    key={booking.id}
                                    className="border-b border-border transition-colors last:border-b-0 hover:bg-neutral-800/40"
                                >
                                    <Td className="whitespace-nowrap">
                                        {date.weekday} {date.day} {date.month}
                                    </Td>
                                    <Td className="whitespace-nowrap tabular-nums">
                                        {formatTime(booking.start)}–{formatTime(booking.end)}
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        {getRoom(booking.roomId)?.name ?? 'Unknown room'}
                                    </Td>
                                    <Td>
                                        <div className="font-medium whitespace-nowrap">
                                            {person.name}
                                        </div>
                                        <div className="text-xs text-muted">{person.email}</div>
                                    </Td>
                                    <Td>
                                        <div className="max-w-56 truncate">{booking.title}</div>
                                    </Td>
                                    <Td>
                                        {badge ? (
                                            <Badge tone={badge.tone}>{badge.label}</Badge>
                                        ) : (
                                            <span className="text-muted">Upcoming</span>
                                        )}
                                    </Td>
                                    <Td className="text-right">
                                        {canCancelBooking(user, booking) && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setNotice(null);
                                                    setToCancel(booking);
                                                }}
                                                className="text-red-300 enabled:hover:bg-red-500/10 enabled:hover:text-red-200"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}

            <ConfirmDialog
                open={toCancel !== null}
                title="Cancel this booking?"
                description={
                    toCancel && (
                        <>
                            "{toCancel.title}" by {personOf(toCancel.userId).name} on{' '}
                            {formatDate(toCancel.start)}, {formatTime(toCancel.start)}–
                            {formatTime(toCancel.end)}, will be cancelled. They'll see it as
                            cancelled in their bookings.
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
