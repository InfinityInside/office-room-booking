import { Link, useParams } from 'react-router';
import { addDays, addMinutesToTime, formatLongDate, todayInput } from '../utils/time.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import { useState } from 'react';
import { canBookRoom, getBookingsForRoom, getEquipmentType, getRoom } from '../api/mockApi.ts';
import type { Booking } from '../types.ts';
import { BookingForm } from '../components/BookingForm.tsx';
import { Modal } from '../components/Modal.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { DayTimeline } from '../components/DayTimeline.tsx';

const NEW_BOOKING_MINUTES = 30;

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
            <Card className="mx-auto max-w-md py-12 text-center">
                <h1 className="text-xl font-semibold tracking-tight">Room not found</h1>
                <p className="mt-1 text-sm text-muted">
                    This room doesn't exist or you don't have access to it.
                </p>
                <Link
                    to="/rooms"
                    className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand-hover"
                >
                    Back to search
                </Link>
            </Card>
        );
    }

    // ----- Derived values -----
    const dayBookings = getBookingsForRoom(room.id, date);
    const today = todayInput();
    const equipmentNames = room.equipmentIds
        .map((id) => getEquipmentType(id)?.name)
        .filter((name): name is string => name !== undefined);

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

    return (
        <div className="flex flex-col gap-6">
            <Link
                to="/rooms"
                className="w-fit text-sm text-muted transition-colors hover:text-neutral-100"
            >
                ← Back to search
            </Link>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
                {/* Room info */}
                <Card className="flex flex-col gap-5 lg:sticky lg:top-32">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
                        {room.description && (
                            <p className="text-sm text-muted">{room.description}</p>
                        )}
                    </div>
                    <dl className="grid grid-cols-2 gap-4">
                        <div>
                            <dt className="text-xs text-muted">Floor</dt>
                            <dd className="mt-0.5 font-medium">{room.floor}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted">Capacity</dt>
                            <dd className="mt-0.5 font-medium">{room.capacity} people</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-xs text-muted">Equipment</dt>
                            <dd className="mt-1.5 flex flex-wrap gap-1.5">
                                {equipmentNames.length > 0 ? (
                                    equipmentNames.map((name) => <Badge key={name}>{name}</Badge>)
                                ) : (
                                    <span className="text-sm">None</span>
                                )}
                            </dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-xs text-muted">Access</dt>
                            <dd className="mt-0.5 font-medium">
                                {room.grantIds.length > 0 ? 'Restricted' : 'Open to everyone'}
                            </dd>
                        </div>
                    </dl>
                </Card>
                {/* Day timeline */}
                <Card className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight">
                            {formatLongDate(date)}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                aria-label="Previous day"
                                onClick={() => changeDate(addDays(date, -1))}
                            >
                                ←
                            </Button>
                            <Button
                                size="sm"
                                disabled={date === today}
                                onClick={() => changeDate(today)}
                            >
                                Today
                            </Button>
                            <Button
                                size="sm"
                                aria-label="Next day"
                                onClick={() => changeDate(addDays(date, 1))}
                            >
                                →
                            </Button>
                            <Input
                                type="date"
                                aria-label="Date"
                                value={date}
                                onChange={(e) => changeDate(e.target.value)}
                                className="h-9 w-auto"
                            />
                        </div>
                    </div>

                    {message && <Alert tone="success">{message}</Alert>}

                    <DayTimeline
                        date={date}
                        bookings={dayBookings}
                        currentUserId={user.id}
                        onSlotClick={handleSlotClick}
                    />

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                        <span className="flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="size-3 rounded-sm border border-brand/60 bg-brand/20"
                            />
                            Your booking
                        </span>
                        <span className="flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="size-3 rounded-sm border border-border-strong bg-neutral-800"
                            />
                            Booked by someone else
                        </span>
                        <span>Click a free time to book it.</span>
                    </div>
                </Card>
            </div>

            <Modal
                open={selectedSlot !== null}
                title={`Book ${room.name}`}
                onClose={() => setSelectedSlot(null)}
            >
                {selectedSlot && (
                    <BookingForm
                        key={`${date}-${selectedSlot}`}
                        room={room}
                        initialDate={date}
                        initialStartTime={selectedSlot}
                        initialEndTime={addMinutesToTime(selectedSlot, NEW_BOOKING_MINUTES)}
                        onBooked={handleBooked}
                        onCancel={() => setSelectedSlot(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
