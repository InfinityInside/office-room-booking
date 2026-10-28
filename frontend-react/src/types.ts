// ---------- Grants ----------

export type GrantType = 'SYSTEM' | 'ROOM_ACCESS';

export interface Grant {
    id: number;
    code: string; // stable identifier used in code, e.g. "ADMIN", "IT"
    name: string; // display name, can be renamed by admins
    type: GrantType;
    description: string;
    active: boolean;
}

// ---------- Users ----------

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    active: boolean;
    grantIds: number[];
}

// ---------- Rooms ----------

export interface EquipmentType {
    id: number;
    code: string; // e.g. "PROJECTOR"
    name: string; // e.g. "Projector"
}

export interface Room {
    id: number;
    name: string;
    floor: number;
    capacity: number;
    equipmentIds: number[];
    description: string;
    active: boolean;
    grantIds: number[]; // empty = open to every user
}

// ---------- Bookings ----------

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
    id: number;
    roomId: number;
    userId: number;
    title: string;
    description: string;
    start: string; // ISO date-time, e.g. "2026-10-29T08:00:00.000Z"
    end: string;
    status: BookingStatus;
    createdAt: string;
}
