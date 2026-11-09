import { Link } from 'react-router';
import type { Room } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export type Availability = 'free' | 'booked' | 'past' | 'unknown';

const AVAILABILITY_BADGES: Record<
    Availability,
    { label: string; tone: 'brand' | 'neutral' } | null
> = {
    free: { label: 'Free', tone: 'brand' },
    booked: { label: 'Booked', tone: 'neutral' },
    past: { label: 'In the past', tone: 'neutral' },
    unknown: null, // e.g. an invalid time range: no badge
};

interface RoomCardProps {
    room: Room;
    equipmentNames: string[];
    availability: Availability;
    onBook: () => void;
}

export function RoomCard({ room, equipmentNames, availability, onBook }: RoomCardProps) {
    const badge = AVAILABILITY_BADGES[availability];

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold tracking-tight">{room.name}</h2>
                    <p className="text-sm text-muted">
                        Floor {room.floor} · up to {room.capacity} people
                    </p>
                </div>
                {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {equipmentNames.map((name) => (
                    <Badge key={name}>{name}</Badge>
                ))}
                {room.grantIds.length > 0 && (
                    <Badge className="border border-border-strong bg-transparent text-muted">
                        Restricted
                    </Badge>
                )}
            </div>

            <div className="mt-auto flex items-center gap-4 pt-1">
                <Button variant="primary" disabled={availability !== 'free'} onClick={onBook}>
                    Book
                </Button>
                <Link
                    to={`/rooms/${room.id}`}
                    className="text-sm font-medium text-brand hover:text-brand-hover"
                >
                    Details
                </Link>
            </div>
        </Card>
    );
}
