import { Link, useParams } from 'react-router';
import {
    addDays,
    addMinutesToTime,
    combine,
    formatLongDate,
    overlaps,
    timeOptions,
    todayInput,
} from '../utils/time.ts';
import { BOOKING_RULES } from '../bookingRules.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import { type ReactNode, useState } from 'react';
import { canBookRoom, getBookingsForRoom, getEquipmentType, getRoom } from '../api/mockApi.ts';
import type { Booking } from '../types.ts';
import { BookingForm } from '../components/BookingForm.tsx';

const SLOT_MINUTES = 15;

/** The timeline's rows: 07:00, 07:30, ... 19:30 */
const SLOTS = timeOptions(
    BOOKING_RULES.openTime,
    addMinutesToTime(BOOKING_RULES.closeTime, -SLOT_MINUTES),
    SLOT_MINUTES,
);

export function RoomDetailsPage() {
    const { roomId } = useParams();

    const user = useCurrentUser();

    const [date, setDate] = useState(todayInput);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // null = form closed
    const [message, setMessage] = useState<string | null>(null);

    // ----- The room, if this user may see it -----
    const room = getRoom(Number(roomId));

    if (!room || !canBookRoom(user, room)) {
        return (
            <>
                <h1>Room not found</h1>
                <p>This room doesn't exist or you don't have access to it.</p>
                <Link to="/rooms">Back to search</Link>
            </>
        );
    }

    // ----- Derived values -----
    const dayBookings = getBookingsForRoom(room.id, date);
    const now = new Date();

    const bookingInSlot = (slot: string): Booking | undefined => {
        const slotStart = combine(date, slot);
        const slotEnd = combine(date, addMinutesToTime(slot, SLOT_MINUTES));
        return dayBookings.find((b) =>
            overlaps(new Date(b.start), new Date(b.end), slotStart, slotEnd),
        );
    };

    // ----- Event handlers -----
    const changeDate = (newDate: string) => {
        setDate(newDate);
        setSelectedSlot(null);
    };

    const handleSlotClick = (slot: string) => {
        setMessage(null);
        setSelectedSlot(slot);
    };

    const handleBooked = (booking: Booking) => {
        setMessage(`Booked "${booking.title}".`);
        setSelectedSlot(null);
    };

    // ----- Render helper for one timeline row -----
    const renderSlotStatus = (slot: string): ReactNode => {
        const booking = bookingInSlot(slot);
        if (booking) {
            return booking.userId === user.id ? (
                <strong>Your booking: {booking.title}</strong>
            ) : (
                'Booked'
            );
        }
        if (combine(date, slot) < now) {
            return 'Past';
        }
        return (
            <button type="button" onClick={() => handleSlotClick(slot)}>
                Free, book this slot
            </button>
        );
    };

    return (
        <>
            <p>
                <Link to="/rooms">Back to search</Link>
            </p>

            <h1>{room.name}</h1>
            <dl>
                <dt>Floor</dt>
                <dd>{room.floor}</dd>
                <dt>Capacity</dt>
                <dd>{room.capacity} people</dd>
                <dt>Equipment</dt>
                <dd>
                    {room.equipmentIds.map((id) => getEquipmentType(id)?.name).join(', ') || 'None'}
                </dd>
                {room.description && (
                    <>
                        <dt>Description</dt>
                        <dd>{room.description}</dd>
                    </>
                )}
            </dl>

            <h2>Availability</h2>
            <p>
                <button type="button" onClick={() => changeDate(addDays(date, -1))}>
                    Previous day
                </button>{' '}
                <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} />{' '}
                <button type="button" onClick={() => changeDate(addDays(date, 1))}>
                    Next day
                </button>
            </p>
            <h3>{formatLongDate(date)}</h3>

            {message && <p role="status">{message}</p>}

            {selectedSlot && (
                <BookingForm
                    key={`${date}-${selectedSlot}`}
                    room={room}
                    initialDate={date}
                    initialStartTime={selectedSlot}
                    initialEndTime={addMinutesToTime(selectedSlot, SLOT_MINUTES)}
                    onBooked={handleBooked}
                    onCancel={() => setSelectedSlot(null)}
                />
            )}

            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {SLOTS.map((slot) => (
                        <tr key={slot}>
                            <td>
                                {slot}–{addMinutesToTime(slot, SLOT_MINUTES)}
                            </td>
                            <td>{renderSlotStatus(slot)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
