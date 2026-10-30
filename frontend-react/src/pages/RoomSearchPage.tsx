import {
    canBookRoom,
    getEquipmentType,
    getEquipmentTypes,
    getRooms,
    isRoomFree,
} from '../api/mockApi.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import { useState } from 'react';
import { combine, todayInput } from '../utils/time.ts';
import { toggleItem } from '../utils/list.ts';
import { Link } from 'react-router';
import type { Booking, Room } from '../types.ts';
import { TimeSelect } from './TimeSelect.tsx';
import { END_TIMES, START_TIMES } from '../bookingRules.ts';
import { BookingForm } from './BookingForm.tsx';

export function RoomSearchPage() {
    const user = useCurrentUser();

    // ----- State: only what the user chose -----
    const [date, setDate] = useState(todayInput);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
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

    function isBookable(roomId: number): boolean {
        return validRange && !isPast && isRoomFree(roomId, start, end);
    }

    function availability(roomId: number): string {
        if (!validRange) {
            return '—';
        }
        if (isPast) {
            return 'In the past';
        }
        return isRoomFree(roomId, start, end) ? 'Free' : 'Booked';
    }

    function handleBookClick(room: Room) {
        setMessage(null);
        setBookingRoom(room);
    }

    function handleBooked(booking: Booking) {
        setMessage(`Booked "${booking.title}" in ${bookingRoom?.name}.`);
        setBookingRoom(null);
    }

    return (
        <>
            <h1>Find a room</h1>
            <fieldset>
                <legend>Filters</legend>
                <p>
                    <label>
                        Date{' '}
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>{' '}
                    <label>
                        From{' '}
                        <TimeSelect
                            value={startTime}
                            options={START_TIMES}
                            onChange={setStartTime}
                        />
                    </label>{' '}
                    <label>
                        To <TimeSelect value={endTime} options={END_TIMES} onChange={setEndTime} />
                    </label>
                </p>
                <p>
                    <label>
                        Min. capacity{' '}
                        <input
                            type="number"
                            min={1}
                            value={minCapacity}
                            onChange={(e) => setMinCapacity(Number(e.target.value))}
                        />
                    </label>{' '}
                    <label>
                        Floor{' '}
                        <select value={floor} onChange={(e) => setFloor(e.target.value)}>
                            <option value="">Any</option>
                            {floors.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </label>
                </p>
                <p>
                    Equipment:{' '}
                    {getEquipmentTypes().map((type) => (
                        <label key={type.id}>
                            <input
                                type="checkbox"
                                checked={equipmentIds.includes(type.id)}
                                onChange={() =>
                                    setEquipmentIds((current) => toggleItem(current, type.id))
                                }
                            />
                            {type.name}{' '}
                        </label>
                    ))}
                </p>
            </fieldset>

            {!validRange && <p role="alert">End time must be after start time.</p>}
            {message && <p role="status">{message}</p>}

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

            {results.length === 0 ? (
                <p>No rooms match your filters. Try a lower capacity or fewer equipment options.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Room</th>
                            <th>Floor</th>
                            <th>Capacity</th>
                            <th>Equipment</th>
                            <th>Availability</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((room) => (
                            <tr key={room.id}>
                                <td>
                                    {room.name}
                                    {room.grantIds.length > 0 && ' (restricted)'}
                                </td>
                                <td>{room.floor}</td>
                                <td>{room.capacity}</td>
                                <td>
                                    {room.equipmentIds
                                        .map((id) => getEquipmentType(id)?.name)
                                        .join(', ') || 'None'}
                                </td>
                                <td>{availability(room.id)}</td>
                                <td>
                                    <button
                                        type="button"
                                        disabled={!isBookable(room.id)}
                                        onClick={() => handleBookClick(room)}
                                    >
                                        Book
                                    </button>{' '}
                                    <Link to={`/rooms/${room.id}`}>Details</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}
