import { getEquipmentType, getRooms } from '../api/mockApi.ts';

export function RoomSearchPage() {
    const rooms = getRooms();

    return (
        <>
            <h1>Find a room</h1>
            <ul>
                {rooms.map((room) => (
                    <li key={room.id}>
                        {room.name}, floor {room.floor}, up to {room.capacity} people. Equipment:{' '}
                        {room.equipmentIds.map((id) => getEquipmentType(id)?.name).join(', ') || 'none'}
                    </li>
                ))}
            </ul>
        </>
    );
}
