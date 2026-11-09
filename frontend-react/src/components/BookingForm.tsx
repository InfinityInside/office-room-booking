import { useState, type SubmitEvent } from 'react';
import { createBooking } from '../api/mockApi.ts';
import { useCurrentUser } from '../auth/AuthContext.ts';
import { BOOKING_RULES, END_TIMES, START_TIMES } from '../bookingRules.ts';
import type { Booking, Room } from '../types.ts';
import { addDays, todayInput } from '../utils/time.ts';
import { TimeSelect } from './TimeSelect.tsx';
import { Field } from './ui/Field.tsx';
import { Input } from './ui/Input.tsx';
import { Textarea } from './ui/Textarea.tsx';
import { Alert } from './ui/Alert.tsx';
import { Button } from './ui/Button.tsx';

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                <Field label="Date" className="col-span-2 sm:col-span-1">
                    <Input
                        type="date"
                        value={date}
                        min={today}
                        max={addDays(today, BOOKING_RULES.maxDaysAhead)}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </Field>
                <Field label="From">
                    <TimeSelect value={startTime} options={START_TIMES} onChange={setStartTime} />
                </Field>
                <Field label="To">
                    <TimeSelect value={endTime} options={END_TIMES} onChange={setEndTime} />
                </Field>
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <div className="flex justify-end gap-3 pt-2">
                <Button onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary">Book</Button>
            </div>
        </form>
    );
}
