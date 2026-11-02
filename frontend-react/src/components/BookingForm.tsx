import { useState, type SubmitEvent } from 'react';
import { createBooking } from '../api/mockApi.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import { BOOKING_RULES, END_TIMES, START_TIMES } from '../bookingRules.ts';
import type { Booking, Room } from '../types.ts';
import { addDays, todayInput } from '../utils/time.ts';
import { TimeSelect } from '../pages/TimeSelect.tsx';

interface BookingFormProps {
    room: Room;
    initialDate: string;
    initialStartTime: string;
    initialEndTime: string;
    onBooked: (booking: Booking) => void;
    onCancel: () => void;
}

export function BookingForm({
    room,
    initialDate,
    initialStartTime,
    initialEndTime,
    onBooked,
    onCancel,
}: BookingFormProps) {
    const user = useCurrentUser();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(initialDate);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [endTime, setEndTime] = useState(initialEndTime);
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const booking = createBooking(
                { roomId: room.id, title, description, date, startTime, endTime },
                user,
            );
            onBooked(booking);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Booking failed.');
        }
    }

    const today = todayInput();

    return (
        <form onSubmit={handleSubmit}>
            <fieldset>
                <legend>Book {room.name}</legend>
                <p>
                    <label>
                        Title{' '}
                        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </label>
                </p>
                <p>
                    <label>
                        Description{' '}
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Date{' '}
                        <input
                            type="date"
                            value={date}
                            min={today}
                            max={addDays(today, BOOKING_RULES.maxDaysAhead)}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
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
                {error && <p role="alert">{error}</p>}
                <button type="submit">Book</button>{' '}
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
            </fieldset>
        </form>
    );
}
