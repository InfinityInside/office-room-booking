import { useParams } from 'react-router';

export function RoomDetailsPage() {
    const { roomId } = useParams();

    return (
        <>
            <h1>Room {roomId}</h1>
            <p>Room details and the day timeline will go here.</p>
        </>
    );
}
