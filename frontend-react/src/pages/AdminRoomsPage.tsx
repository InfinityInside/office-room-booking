import { useState } from 'react';
import type { Room } from '../types.ts';
import { getEquipmentType, getGrant, getRooms } from '../api/mockApi.ts';
import { RoomForm } from '../components/RoomForm.tsx';

export function AdminRoomsPage() {
    // null = no form open, 'new' = adding a room, a Room = editing that room
    const [editing, setEditing] = useState<Room | 'new' | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // ----- Derived values -----
    const rooms = getRooms().sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name));

    const equipmentNames = (room: Room) =>
        room.equipmentIds.map((id) => getEquipmentType(id)?.name).join(', ') || 'None';

    const whoCanBook = (room: Room) =>
        room.grantIds.length === 0
            ? 'Everyone'
            : room.grantIds.map((id) => getGrant(id)?.name).join(', ');

    // ----- Event handlers -----
    const openForm = (target: Room | 'new') => {
        setMessage(null);
        setEditing(target);
    };

    const handleSaved = (room: Room) => {
        setMessage(`Saved ${room.name}.`);
        setEditing(null);
    };

    return (
        <>
            <h1>Manage rooms</h1>
            <p>
                <button type="button" onClick={() => openForm('new')}>
                    Add room
                </button>
            </p>

            {message && <p role="status">{message}</p>}

            {editing && (
                <RoomForm
                    key={editing === 'new' ? 'new' : editing.id}
                    room={editing === 'new' ? null : editing}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                />
            )}

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Floor</th>
                        <th>Capacity</th>
                        <th>Equipment</th>
                        <th>Who can book</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map((room) => (
                        <tr key={room.id}>
                            <td>{room.name}</td>
                            <td>{room.floor}</td>
                            <td>{room.capacity}</td>
                            <td>{equipmentNames(room)}</td>
                            <td>{whoCanBook(room)}</td>
                            <td>{room.active ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button type="button" onClick={() => openForm(room)}>
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
