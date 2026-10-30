// A fake, in-memory "backend". All data resets when the page reloads.
// Pages only use the exported functions, never the arrays directly.

import type { Booking, EquipmentType, Grant, Room, User } from '../types';
import { addDays, combine, overlaps, todayInput } from '../utils/time';
import { SYSTEM_GRANTS } from '../grants.ts';

// Seed bookings are relative to today, so the demo always has upcoming bookings.
const today = todayInput();
const at = (dayOffset: number, time: string) =>
    combine(addDays(today, dayOffset), time).toISOString();

// ---------- Seed data ----------

const grants: Grant[] = [
    {
        id: 1,
        code: 'ADMIN',
        name: 'Admin',
        type: 'SYSTEM',
        description: 'Access to admin pages',
        active: true,
    },
    {
        id: 2,
        code: 'IT',
        name: 'IT',
        type: 'ROOM_ACCESS',
        description: 'IT department rooms',
        active: true,
    },
    {
        id: 3,
        code: 'MANAGEMENT',
        name: 'Management',
        type: 'ROOM_ACCESS',
        description: 'Board and management rooms',
        active: true,
    },
];

const users: User[] = [
    {
        id: 1,
        firstName: 'Anna',
        lastName: 'Admin',
        email: 'anna@office.test',
        active: true,
        grantIds: [1],
    },
    {
        id: 2,
        firstName: 'Tom',
        lastName: 'Novak',
        email: 'tom@office.test',
        active: true,
        grantIds: [],
    },
    {
        id: 3,
        firstName: 'Ivy',
        lastName: 'Tech',
        email: 'ivy@office.test',
        active: true,
        grantIds: [2],
    },
];

const equipmentTypes: EquipmentType[] = [
    { id: 1, code: 'PROJECTOR', name: 'Projector' },
    { id: 2, code: 'TV_SCREEN', name: 'TV screen' },
    { id: 3, code: 'WHITEBOARD', name: 'Whiteboard' },
    { id: 4, code: 'VIDEO_CONFERENCING', name: 'Video conferencing' },
];

const rooms: Room[] = [
    {
        id: 1,
        name: 'Aurora',
        floor: 1,
        capacity: 6,
        equipmentIds: [2, 3],
        description: 'Small meeting room by the kitchen.',
        active: true,
        grantIds: [],
    },
    {
        id: 2,
        name: 'Borealis',
        floor: 1,
        capacity: 12,
        equipmentIds: [1, 3, 4],
        description: 'Main conference room.',
        active: true,
        grantIds: [],
    },
    {
        id: 3,
        name: 'Cosmos',
        floor: 2,
        capacity: 4,
        equipmentIds: [2],
        description: '',
        active: true,
        grantIds: [],
    },
    {
        id: 4,
        name: 'Server Room Huddle',
        floor: 2,
        capacity: 3,
        equipmentIds: [3],
        description: 'Next to the server room.',
        active: true,
        grantIds: [2],
    },
    {
        id: 5,
        name: 'Boardroom',
        floor: 3,
        capacity: 16,
        equipmentIds: [1, 2, 3, 4],
        description: 'For management meetings.',
        active: true,
        grantIds: [3],
    },
    {
        id: 6,
        name: 'Old Library',
        floor: 0,
        capacity: 8,
        equipmentIds: [],
        description: 'Closed for renovation.',
        active: false,
        grantIds: [],
    },
];

const bookings: Booking[] = [
    {
        id: 1,
        roomId: 1,
        userId: 2,
        title: 'Team standup',
        description: '',
        start: at(1, '09:00'),
        end: at(1, '09:30'),
        status: 'CONFIRMED',
        createdAt: at(-1, '10:00'),
    },
    {
        id: 2,
        roomId: 2,
        userId: 1,
        title: 'Quarterly planning',
        description: '',
        start: at(1, '13:00'),
        end: at(1, '15:00'),
        status: 'CONFIRMED',
        createdAt: at(-1, '11:00'),
    },
    {
        id: 3,
        roomId: 1,
        userId: 3,
        title: 'Sprint review',
        description: '',
        start: at(2, '10:00'),
        end: at(2, '11:00'),
        status: 'CONFIRMED',
        createdAt: at(-1, '12:00'),
    },
    {
        id: 4,
        roomId: 3,
        userId: 2,
        title: '1:1 with manager',
        description: '',
        start: at(-2, '14:00'),
        end: at(-2, '14:30'),
        status: 'CONFIRMED',
        createdAt: at(-5, '09:00'),
    },
    {
        id: 5,
        roomId: 4,
        userId: 3,
        title: 'Server migration sync',
        description: '',
        start: at(1, '11:00'),
        end: at(1, '12:00'),
        status: 'CONFIRMED',
        createdAt: at(-1, '13:00'),
    },
];

// Ids for records created while the app runs. Seed data uses 1–99.
let nextId = 100;

// ---------- Read functions ----------

export const getGrants = () => [...grants];
export const getGrant = (id: number) => grants.find((g) => g.id === id);

export const getUsers = () => [...users];
export const getUser = (id: number) => users.find((u) => u.id === id);

export const getEquipmentTypes = () => [...equipmentTypes];
export const getEquipmentType = (id: number) => equipmentTypes.find((e) => e.id === id);

export const getRooms = () => [...rooms];
export const getRoom = (id: number) => rooms.find((r) => r.id === id);

export const getBookings = () => [...bookings];
export const getBookingsForUser = (userId: number) => bookings.filter((b) => b.userId === userId);

/** True if no confirmed booking of the room overlaps the given time range. */
export function isRoomFree(roomId: number, start: Date, end: Date): boolean {
    return !bookings.some(
        (b) =>
            b.roomId === roomId &&
            b.status === 'CONFIRMED' &&
            overlaps(new Date(b.start), new Date(b.end), start, end),
    );
}

// ---------- Auth ----------

const findUserByEmail = (email: string) =>
    users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

/** Mock login: any non-empty password works for an active user. */
export function login(email: string, password: string): User | null {
    const user = findUserByEmail(email);
    if (!user || !user.active || password.length === 0) {
        return null;
    }
    return user;
}

export interface NewUser {
    firstName: string;
    lastName: string;
    email: string;
}

export function register(input: NewUser): User {
    if (findUserByEmail(input.email)) {
        throw new Error('An account with this email already exists.');
    }

    const user: User = {
        id: nextId++,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim(),
        active: true,
        grantIds: [],
    };
    users.push(user);
    return user;
}

/** True if the user holds an active grant with this code. */
export function hasGrant(user: User, code: string): boolean {
    return user.grantIds.some((id) => {
        const grant = getGrant(id);
        return grant?.code === SYSTEM_GRANTS.ADMIN || grant?.code === code && grant.active;
    });
}

/**
 * Who may book a room:
 * - inactive rooms: nobody
 * - admins: every active room
 * - open rooms (no grants linked): everyone
 * - restricted rooms: holders of any one of the linked, active grants
 */
export function canBookRoom(user: User, room: Room): boolean {
    if (!room.active) {
        return false;
    }
    if (hasGrant(user, SYSTEM_GRANTS.ADMIN)) {
        return true;
    }
    if (room.grantIds.length === 0) {
        return true;
    }
    return room.grantIds.some((id) => user.grantIds.includes(id) && getGrant(id)?.active === true);
}
