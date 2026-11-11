import { useState } from 'react';
import type { Room } from '../types.ts';
import { getEquipmentType, getGrant, getRooms } from '../api/mockApi.ts';
import { RoomForm } from '../components/RoomForm.tsx';
import { useRefresh } from '../hooks/useRefresh.ts';
import { EquipmentTypesSection } from '../components/EquipmentTypesSection.tsx';
import { Modal } from '../components/Modal.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Table, Td, Th } from '../components/ui/Table.tsx';
import { Badge } from '../components/ui/Badge.tsx';

export function AdminRoomsPage() {
    // null = no form open, 'new' = adding a room, a Room = editing that room
    const [editing, setEditing] = useState<Room | 'new' | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const refresh = useRefresh();

    // ----- Derived values -----
    const rooms = getRooms().sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name));

    const equipmentNames = (room: Room) =>
        room.equipmentIds
            .map((id) => getEquipmentType(id)?.name)
            .filter((name): name is string => name !== undefined);

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
        <div className="flex flex-col gap-12">
            <section className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-semibold tracking-tight">Manage rooms</h1>
                        <p className="text-sm text-muted">
                            Add rooms, change their details, and decide who can book them.
                        </p>
                    </div>
                    <Button variant="primary" onClick={() => openForm('new')}>
                        Add room
                    </Button>
                </div>

                {message && <Alert tone="success">{message}</Alert>}

                <Table>
                    <thead>
                        <tr>
                            <Th>Name</Th>
                            <Th className="text-right">Floor</Th>
                            <Th className="text-right">Capacity</Th>
                            <Th>Equipment</Th>
                            <Th>Who can book</Th>
                            <Th>Status</Th>
                            <Th>
                                <span className="sr-only">Actions</span>
                            </Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room) => {
                            const names = equipmentNames(room);
                            return (
                                <tr
                                    key={room.id}
                                    className="border-b border-border transition-colors last:border-b-0 hover:bg-neutral-800/40"
                                >
                                    <Td>
                                        <div className="font-medium">{room.name}</div>
                                        {room.description && (
                                            <div className="max-w-64 truncate text-xs text-muted">
                                                {room.description}
                                            </div>
                                        )}
                                    </Td>
                                    <Td className="text-right tabular-nums">{room.floor}</Td>
                                    <Td className="text-right tabular-nums">{room.capacity}</Td>
                                    <Td>
                                        <div className="flex min-w-40 flex-wrap gap-1.5">
                                            {names.length > 0 ? (
                                                names.map((name) => (
                                                    <Badge key={name}>{name}</Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted">None</span>
                                            )}
                                        </div>
                                    </Td>
                                    <Td className="whitespace-nowrap">{whoCanBook(room)}</Td>
                                    <Td>
                                        <Badge tone={room.active ? 'neutral' : 'danger'}>
                                            {room.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </Td>
                                    <Td className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openForm(room)}
                                        >
                                            Edit
                                        </Button>
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </section>

            <EquipmentTypesSection onChanged={refresh} />

            <Modal
                open={editing !== null}
                title={editing === 'new' ? 'Add room' : `Edit ${editing?.name ?? ''}`}
                onClose={() => setEditing(null)}
            >
                {editing && (
                    <RoomForm
                        key={editing === 'new' ? 'new' : editing.id}
                        room={editing === 'new' ? null : editing}
                        onSaved={handleSaved}
                        onCancel={() => setEditing(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
