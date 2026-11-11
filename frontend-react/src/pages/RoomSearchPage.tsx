import {
    canBookRoom,
    getEquipmentType,
    getEquipmentTypes,
    getRooms,
    isRoomFree,
} from '../api/mockApi.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import { useState } from 'react';
import { combine, formatLongDate } from '../utils/time.ts';
import { toggleItem } from '../utils/list.ts';
import type { Booking, Room } from '../types.ts';
import { TimeSelect } from '../components/TimeSelect.tsx';
import { defaultSearchSlot, END_TIMES, START_TIMES } from '../bookingRules.ts';
import { BookingForm } from '../components/BookingForm.tsx';
import { Modal } from '../components/Modal.tsx';
import  { type Availability, RoomCard } from '../components/RoomCard.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Field } from '../components/ui/Field.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Select } from '../components/ui/Select.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Chip } from '../components/ui/Chip.tsx';

export function RoomSearchPage() {
    const user = useCurrentUser();

    // ----- State: only what the user chose -----
    const [initialSlot] = useState(defaultSearchSlot);
    const [date, setDate] = useState(initialSlot.date);
    const [startTime, setStartTime] = useState(initialSlot.startTime);
    const [endTime, setEndTime] = useState(initialSlot.endTime);
    const [minCapacity, setMinCapacity] = useState(1);
    const [floor, setFloor] = useState(''); // '' = any floor
    const [equipmentIds, setEquipmentIds] = useState<number[]>([]);

    const [bookingRoom, setBookingRoom] = useState<Room | null>(null); // null = form closed
    const [message, setMessage] = useState<string | null>(null);

    // ----- Derived values: recalculated on every render -----
    const accessibleRooms = getRooms().filter((room) => canBookRoom(user, room));
    const floors = [...new Set(accessibleRooms.map((room) => room.floor))].sort((a, b) => a - b);

    const start = combine(date, startTime);
    const end = combine(date, endTime);
    const validRange = end > start;
    const isPast = start < new Date();

    const results = accessibleRooms.filter(
        (room) =>
            room.capacity >= minCapacity &&
            (floor === '' || room.floor === Number(floor)) &&
            equipmentIds.every((id) => room.equipmentIds.includes(id)),
    );

    const availabilityOf = (roomId: number): Availability => {
        if (!validRange) {
            return 'unknown';
        }
        if (isPast) {
            return 'past';
        }
        return isRoomFree(roomId, start, end) ? 'free' : 'booked';
    };

    const freeCount = results.filter((room) => availabilityOf(room.id) === 'free').length;

    function handleBookClick(room: Room) {
        setMessage(null);
        setBookingRoom(room);
    }

    function handleBooked(booking: Booking) {
        setMessage(`Booked "${booking.title}" in ${bookingRoom?.name}.`);
        setBookingRoom(null);
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-semibold tracking-tight">Find a room</h1>
                <p className="text-sm text-muted">
                    {formatLongDate(date)} · {startTime}–{endTime}
                    {validRange && !isPast && ` · ${freeCount} of ${results.length} rooms free`}
                </p>
            </div>
            <Card className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <Field label="Date" className="col-span-2 lg:col-span-1">
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </Field>
                    <Field label="From">
                        <TimeSelect
                            value={startTime}
                            options={START_TIMES}
                            onChange={setStartTime}
                        />
                    </Field>
                    <Field label="To">
                        <TimeSelect value={endTime} options={END_TIMES} onChange={setEndTime} />
                    </Field>
                    <Field label="Min. capacity">
                        <Input
                            type="number"
                            min={1}
                            value={minCapacity}
                            onChange={(e) => setMinCapacity(Number(e.target.value))}
                        />
                    </Field>
                    <Field label="Floor">
                        <Select value={floor} onChange={(e) => setFloor(e.target.value)}>
                            <option value="">Any</option>
                            {floors.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </Select>
                    </Field>
                </div>
                <div
                    role="group"
                    aria-labelledby="equipment-label"
                    className="flex flex-wrap items-center gap-2"
                >
                    <span
                        id="equipment-label"
                        className="mr-1 text-sm font-medium text-neutral-300"
                    >
                        Equipment
                    </span>
                    {getEquipmentTypes().map((type) => {
                        const selected = equipmentIds.includes(type.id);
                        return (
                            <Chip
                                key={type.id}
                                selected={selected}
                                onClick={() =>
                                    setEquipmentIds((current) => toggleItem(current, type.id))
                                }
                            >
                                {type.name}
                            </Chip>
                        );
                    })}
                </div>
            </Card>

            {!validRange && <Alert tone="error">End time must be after start time.</Alert>}
            {message && <Alert tone="success">{message}</Alert>}

            {results.length === 0 ? (
                <Card className="py-12 text-center">
                    <p className="font-medium">No rooms match your filters</p>
                    <p className="mt-1 text-sm text-muted">
                        Try a lower capacity or fewer equipment options.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {results.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                equipmentNames={room.equipmentIds
                                    .map((id) => getEquipmentType(id)?.name)
                                    .filter((name): name is string => name !== undefined)}
                                availability={availabilityOf(room.id)}
                                onBook={() => handleBookClick(room)}
                            />
                        ))}
                </div>
            )}

            <Modal
                open={bookingRoom !== null}
                title={bookingRoom ? `Book ${bookingRoom.name}` : ''}
                onClose={() => setBookingRoom(null)}
            >
                {bookingRoom && (
                    <BookingForm
                        key={`${bookingRoom.id}-${date}-${startTime}-${endTime}`}
                        room={bookingRoom}
                        initialDate={date}
                        initialStartTime={startTime}
                        initialEndTime={endTime}
                        onBooked={handleBooked}
                        onCancel={() => setBookingRoom(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
