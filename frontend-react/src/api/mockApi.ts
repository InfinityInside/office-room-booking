// A fake, in-memory "backend". All data resets when the page reloads.
// Pages only use the exported functions, never the arrays directly.

import type { Booking, EquipmentType, Grant, Room, User } from '../types';
import { addDays, combine, overlaps, timeToMinutes, todayInput } from '../utils/time';
import { SYSTEM_GRANTS } from '../grants.ts';
import { BOOKING_RULES } from '../bookingRules.ts';

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

/** Every booking, for the admin overview. Admin only. */
export function getAllBookings(user: User): Booking[] {
    requireAdmin(user);
    return [...bookings];
}

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

/** Confirmed bookings of a room that overlap the given day ("YYYY-MM-DD", local time). */
export function getBookingsForRoom(roomId: number, date: string): Booking[] {
    const dayStart = combine(date, '00:00');
    const dayEnd = combine(addDays(date, 1), '00:00');
    return bookings.filter(
        (b) =>
            b.roomId === roomId &&
            b.status === 'CONFIRMED' &&
            overlaps(new Date(b.start), new Date(b.end), dayStart, dayEnd),
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

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/** True if the user holds an active grant with this code. */
export function hasGrant(user: User, code: string): boolean {
    return user.grantIds.some((id) => {
        const grant = getGrant(id);
        return grant?.code === SYSTEM_GRANTS.ADMIN || (grant?.code === code && grant.active);
    });
}

/** Throws unless the user is an admin. Used by every admin-only operation. */
function requireAdmin(user: User): void {
    if (!hasGrant(user, SYSTEM_GRANTS.ADMIN)) {
        throw new Error("You don't have permission to do this.");
    }
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

// ---------- Creating bookings ----------

/** Returns an error message, or null when the times follow the booking rules. */
export function validateBookingTimes(start: Date, end: Date): string | null {
    const { openTime, closeTime, stepMinutes, minMinutes, maxMinutes, maxDaysAhead } =
        BOOKING_RULES;

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 'Enter a valid date and time.';
    }
    if (end <= start) {
        return 'End time must be after start time.';
    }
    if (start < new Date()) {
        return 'You cannot book in the past.';
    }

    const latest = new Date();
    latest.setDate(latest.getDate() + maxDaysAhead);
    if (start > latest) {
        return `You can book at most ${maxDaysAhead} days ahead.`;
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    if (startMinutes < timeToMinutes(openTime) || endMinutes > timeToMinutes(closeTime)) {
        return `Bookings must be between ${openTime} and ${closeTime}.`;
    }
    if (startMinutes % stepMinutes !== 0 || endMinutes % stepMinutes !== 0) {
        return `Times must be in ${stepMinutes}-minute steps.`;
    }

    const duration = endMinutes - startMinutes;
    if (duration < minMinutes) {
        return `A booking must last at least ${minMinutes} minutes.`;
    }
    if (duration > maxMinutes) {
        return `A booking can last at most ${maxMinutes / 60} hours.`;
    }
    return null;
}

export interface NewBooking {
    roomId: number;
    title: string;
    description: string;
    date: string; // "YYYY-MM-DD"
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}

export function createBooking(input: NewBooking, user: User): Booking {
    const room = getRoom(input.roomId);
    if (!room || !canBookRoom(user, room)) {
        throw new Error("This room doesn't exist or you don't have access to it.");
    }
    if (!input.title.trim()) {
        throw new Error('Title is required.');
    }

    const start = combine(input.date, input.startTime);
    const end = combine(input.date, input.endTime);

    const ruleError = validateBookingTimes(start, end);
    if (ruleError) {
        throw new Error(ruleError);
    }
    // The real backend will answer 409 Conflict here.
    if (!isRoomFree(room.id, start, end)) {
        throw new Error('This room is already booked at that time.');
    }

    const booking: Booking = {
        id: nextId++,
        roomId: room.id,
        userId: user.id,
        title: input.title.trim(),
        description: input.description.trim(),
        start: start.toISOString(),
        end: end.toISOString(),
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    return booking;
}

// ---------- Cancelling bookings ----------

/** Owners and admins may cancel confirmed bookings that haven't started yet. */
export function canCancelBooking(user: User, booking: Booking): boolean {
    const isOwnerOrAdmin = booking.userId === user.id || hasGrant(user, SYSTEM_GRANTS.ADMIN);
    return isOwnerOrAdmin && booking.status === 'CONFIRMED' && new Date(booking.start) > new Date();
}

export function cancelBooking(bookingId: number, user: User): void {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
        throw new Error('Booking not found.');
    }
    if (!canCancelBooking(user, booking)) {
        throw new Error('This booking cannot be cancelled.');
    }
    booking.status = 'CANCELLED';
}

// ---------- Managing rooms (admin) ----------

/** A room as entered in the form, before it has an id. */
export type RoomInput = Omit<Room, 'id'>;

/** Creates a room when id is undefined, otherwise updates that room. Admin only. */
export function saveRoom(user: User, input: RoomInput, id?: number): Room {
    requireAdmin(user);

    const name = input.name.trim();
    if (!name) {
        throw new Error('Name is required.');
    }
    if (rooms.some((r) => r.id !== id && r.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Another room already has this name.');
    }
    if (!Number.isInteger(input.floor)) {
        throw new Error('Floor must be a whole number.');
    }
    if (!Number.isInteger(input.capacity) || input.capacity < 1) {
        throw new Error('Capacity must be a whole number of at least 1.');
    }
    if (input.equipmentIds.some((eid) => !getEquipmentType(eid))) {
        throw new Error('Unknown equipment type.');
    }
    if (input.grantIds.some((gid) => getGrant(gid)?.type !== 'ROOM_ACCESS')) {
        throw new Error('Only room-access grants can be linked to rooms.');
    }

    const data: RoomInput = { ...input, name, description: input.description.trim() };

    if (id === undefined) {
        const created: Room = { ...data, id: nextId++ };
        rooms.push(created);
        return created;
    }

    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) {
        throw new Error('Room not found.');
    }
    const updated: Room = { ...data, id };
    rooms[index] = updated;
    return updated;
}

// ---------- Managing equipment types (admin) ----------

/** How many rooms, active or not, have this equipment type. */
export function countRoomsWithEquipment(equipmentId: number): number {
    return rooms.filter((r) => r.equipmentIds.includes(equipmentId)).length;
}

const isEquipmentNameTaken = (name: string, exceptId?: number) =>
    equipmentTypes.some((e) => e.id !== exceptId && e.name.toLowerCase() === name.toLowerCase());

export function createEquipmentType(user: User, code: string, name: string): EquipmentType {
    requireAdmin(user);

    const normalizedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!CODE_PATTERN.test(normalizedCode)) {
        throw new Error(
            'Code must start with a letter and contain only letters, digits and underscores.',
        );
    }
    if (!trimmedName) {
        throw new Error('Name is required.');
    }
    if (equipmentTypes.some((e) => e.code === normalizedCode)) {
        throw new Error('This code is already used.');
    }
    if (isEquipmentNameTaken(trimmedName)) {
        throw new Error('This name is already used.');
    }

    const created: EquipmentType = { id: nextId++, code: normalizedCode, name: trimmedName };
    equipmentTypes.push(created);
    return created;
}

/** Changes only the display name. The code never changes, since logic and data may rely on it. */
export function renameEquipmentType(user: User, id: number, name: string): EquipmentType {
    requireAdmin(user);

    const index = equipmentTypes.findIndex((e) => e.id === id);
    if (index === -1) {
        throw new Error('Equipment type not found.');
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Name is required.');
    }
    if (isEquipmentNameTaken(trimmedName, id)) {
        throw new Error('This name is already used.');
    }

    const updated: EquipmentType = { ...equipmentTypes[index], name: trimmedName };
    equipmentTypes[index] = updated;
    return updated;
}

/** Deletes a type, but only if no room uses it. */
export function deleteEquipmentType(user: User, id: number): void {
    requireAdmin(user);

    const index = equipmentTypes.findIndex((e) => e.id === id);
    if (index === -1) {
        throw new Error('Equipment type not found.');
    }
    const usedBy = countRoomsWithEquipment(id);
    if (usedBy > 0) {
        throw new Error(
            `This type is still assigned to ${usedBy} room(s). Remove it from them first.`,
        );
    }

    equipmentTypes.splice(index, 1);
}

// ---------- Managing grants (admin) ----------

/** How many users hold this grant. */
export function countUsersWithGrant(grantId: number): number {
    return users.filter((u) => u.grantIds.includes(grantId)).length;
}

/** The rooms that require this grant. */
export function getRoomsRequiringGrant(grantId: number): Room[] {
    return rooms.filter((r) => r.grantIds.includes(grantId));
}

/** Creates a room-access grant. System grants only exist in code, see SYSTEM_GRANTS. */
export function createGrant(user: User, code: string, name: string, description: string): Grant {
    requireAdmin(user);

    const normalizedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!CODE_PATTERN.test(normalizedCode)) {
        throw new Error(
            'Code must start with a letter and contain only letters, digits and underscores.',
        );
    }
    if (!trimmedName) {
        throw new Error('Name is required.');
    }
    if (grants.some((g) => g.code === normalizedCode)) {
        throw new Error('This code is already used.');
    }
    if (grants.some((g) => g.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error('This name is already used.');
    }

    const created: Grant = {
        id: nextId++,
        code: normalizedCode,
        name: trimmedName,
        type: 'ROOM_ACCESS',
        description: description.trim(),
        active: true,
    };
    grants.push(created);
    return created;
}

export function setGrantActive(user: User, grantId: number, active: boolean): Grant {
    requireAdmin(user);

    const index = grants.findIndex((g) => g.id === grantId);
    if (index === -1) {
        throw new Error('Grant not found.');
    }
    if (grants[index].type === 'SYSTEM') {
        throw new Error('System grants cannot be deactivated.');
    }

    const updated: Grant = { ...grants[index], active };
    grants[index] = updated;
    return updated;
}

export function setUserGrant(
    user: User,
    targetUserId: number,
    grantId: number,
    granted: boolean,
): void {
    requireAdmin(user);

    const index = users.findIndex((u) => u.id === targetUserId);
    const grant = getGrant(grantId);
    if (index === -1 || !grant) {
        throw new Error('User or grant not found.');
    }
    // Prevent locking yourself out of the admin pages.
    if (!granted && grant.code === SYSTEM_GRANTS.ADMIN && targetUserId === user.id) {
        throw new Error('You cannot remove your own Admin grant.');
    }

    const target = users[index];
    const grantIds = granted
        ? [...new Set([...target.grantIds, grantId])]
        : target.grantIds.filter((id) => id !== grantId);
    users[index] = { ...target, grantIds };
}
