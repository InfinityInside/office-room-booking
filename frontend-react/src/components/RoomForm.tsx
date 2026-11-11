import { useState, type SubmitEvent, useId } from 'react';
import { getEquipmentTypes, getGrants, saveRoom, type RoomInput } from '../api/mockApi';
import { useCurrentUser } from '../auth/AuthContext';
import type { Room } from '../types';
import { toggleItem } from '../utils/list';
import { Field } from './ui/Field.tsx';
import { Input } from './ui/Input.tsx';
import { Textarea } from './ui/Textarea.tsx';
import { Chip } from './ui/Chip.tsx';
import { Alert } from './ui/Alert.tsx';
import { Button } from './ui/Button.tsx';

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

    const equipmentLabelId = useId();
    const grantsLabelId = useId();

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Name">
                <Input
                    value={values.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                />
            </Field>

            <div className="grid grid-cols-2 gap-4">
                <Field label="Floor">
                    <Input
                        type="number"
                        step={1}
                        value={values.floor}
                        onChange={(e) => update('floor', Number(e.target.value))}
                    />
                </Field>
                <Field label="Capacity">
                    <Input
                        type="number"
                        min={1}
                        step={1}
                        value={values.capacity}
                        onChange={(e) => update('capacity', Number(e.target.value))}
                    />
                </Field>
            </div>

            <Field label="Description">
                <Textarea
                    value={values.description}
                    onChange={(e) => update('description', e.target.value)}
                />
            </Field>

            <div role="group" aria-labelledby={equipmentLabelId} className="flex flex-col gap-2">
                <span id={equipmentLabelId} className="text-sm font-medium text-neutral-300">
                    Equipment
                </span>
                <div className="flex flex-wrap gap-2">
                    {equipmentTypes.map((type) => (
                        <Chip
                            key={type.id}
                            selected={values.equipmentIds.includes(type.id)}
                            onClick={() =>
                                update('equipmentIds', toggleItem(values.equipmentIds, type.id))
                            }
                        >
                            {type.name}
                        </Chip>
                    ))}
                </div>
            </div>

            <div role="group" aria-labelledby={grantsLabelId} className="flex flex-col gap-2">
                <span id={grantsLabelId} className="text-sm font-medium text-neutral-300">
                    Required grants
                </span>
                <span className="-mt-1 text-xs text-muted">
                    None selected means the room is open to everyone.
                </span>
                <div className="flex flex-wrap gap-2">
                    {roomAccessGrants.map((grant) => (
                        <Chip
                            key={grant.id}
                            selected={values.grantIds.includes(grant.id)}
                            onClick={() =>
                                update('grantIds', toggleItem(values.grantIds, grant.id))
                            }
                        >
                            {grant.name}
                            {!grant.active && ' (inactive)'}
                        </Chip>
                    ))}
                </div>
            </div>

            {becomesOpen && (
                <Alert tone="warning">With no grants, this room will be open to everyone.</Alert>
            )}

            <label className="flex items-center gap-3 text-sm">
                <input
                    type="checkbox"
                    checked={values.active}
                    onChange={(e) => update('active', e.target.checked)}
                    className="size-4 accent-brand"
                />
                <span>
                    Active{' '}
                    <span className="text-muted">
                        (inactive rooms are hidden from search and can't be booked)
                    </span>
                </span>
            </label>

            {error && <Alert tone="error">{error}</Alert>}

            <div className="flex justify-end gap-3 pt-2">
                <Button onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="primary">{room ? 'Save changes' : 'Add room'}</Button>
            </div>
        </form>
    );
}
