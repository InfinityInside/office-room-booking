import { useState, type SubmitEvent } from 'react';
import { getEquipmentTypes, getGrants, saveRoom, type RoomInput } from '../api/mockApi';
import { useCurrentUser } from '../auth/AuthContext';
import type { Room } from '../types';
import { toggleItem } from '../utils/list';

interface RoomFormProps {
    room: Room | null; // null = adding a new room
    onSaved: (room: Room) => void;
    onCancel: () => void;
}

const EMPTY_ROOM: RoomInput = {
    name: '',
    floor: 0,
    capacity: 4,
    equipmentIds: [],
    description: '',
    active: true,
    grantIds: [],
};

/** Copies a room's editable fields, with fresh arrays so the form never shares them. */
function toInput(room: Room): RoomInput {
    return {
        name: room.name,
        floor: room.floor,
        capacity: room.capacity,
        equipmentIds: [...room.equipmentIds],
        description: room.description,
        active: room.active,
        grantIds: [...room.grantIds],
    };
}

export function RoomForm({ room, onSaved, onCancel }: RoomFormProps) {
    const user = useCurrentUser();

    const [values, setValues] = useState<RoomInput>(() => (room ? toInput(room) : EMPTY_ROOM));
    const [error, setError] = useState<string | null>(null);

    // ----- Derived values -----
    const equipmentTypes = getEquipmentTypes();
    const roomAccessGrants = getGrants().filter((g) => g.type === 'ROOM_ACCESS');
    const becomesOpen = room !== null && room.grantIds.length > 0 && values.grantIds.length === 0;

    // ----- Event handlers -----
    /** Updates one field, keeping the others. */
    const update = <K extends keyof RoomInput>(key: K, value: RoomInput[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            onSaved(saveRoom(user, values, room?.id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Saving failed.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
                <p>
                    <label>
                        Name{' '}
                        <input
                            value={values.name}
                            onChange={(e) => update('name', e.target.value)}
                            required
                        />
                    </label>{' '}
                    <label>
                        Floor{' '}
                        <input
                            type="number"
                            step={1}
                            value={values.floor}
                            onChange={(e) => update('floor', Number(e.target.value))}
                        />
                    </label>{' '}
                    <label>
                        Capacity{' '}
                        <input
                            type="number"
                            min={1}
                            step={1}
                            value={values.capacity}
                            onChange={(e) => update('capacity', Number(e.target.value))}
                        />
                    </label>
                </p>
                <p>
                    <label>
                        Description{' '}
                        <textarea
                            value={values.description}
                            onChange={(e) => update('description', e.target.value)}
                        />
                    </label>
                </p>
                <p>
                    Equipment:{' '}
                    {equipmentTypes.map((type) => (
                        <label key={type.id}>
                            <input
                                type="checkbox"
                                checked={values.equipmentIds.includes(type.id)}
                                onChange={() =>
                                    update('equipmentIds', toggleItem(values.equipmentIds, type.id))
                                }
                            />
                            {type.name}{' '}
                        </label>
                    ))}
                </p>
                <p>
                    Required grants (none = open to everyone):{' '}
                    {roomAccessGrants.map((grant) => (
                        <label key={grant.id}>
                            <input
                                type="checkbox"
                                checked={values.grantIds.includes(grant.id)}
                                onChange={() =>
                                    update('grantIds', toggleItem(values.grantIds, grant.id))
                                }
                            />
                            {grant.name}
                            {!grant.active && ' (inactive)'}{' '}
                        </label>
                    ))}
                </p>
                {becomesOpen && (
                    <p role="alert">Warning: with no grants, this room will be open to everyone.</p>
                )}
                <p>
                    <label>
                        <input
                            type="checkbox"
                            checked={values.active}
                            onChange={(e) => update('active', e.target.checked)}
                        />{' '}
                        Active (inactive rooms are hidden from search and can't be booked)
                    </label>
                </p>
                {error && <p role="alert">{error}</p>}
                <button type="submit">{room ? 'Save changes' : 'Add room'}</button>{' '}
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
        </form>
    );
}
