import type { components } from './schema';

type Schemas = components['schemas'];

// Auth and users
export type User = Schemas['User'];
export type CurrentUser = Schemas['CurrentUser'];
export type UserSummary = Schemas['UserSummary'];
export type AuthResponse = Schemas['AuthResponse'];
export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];

// Rooms and equipment
export type Room = Schemas['Room'];
export type AdminRoom = Schemas['AdminRoom'];
export type RoomInput = Schemas['RoomInput'];
export type RoomSummary = Schemas['RoomSummary'];
export type RoomAvailability = Schemas['RoomAvailability'];
export type RoomBookingSlot = Schemas['RoomBookingSlot'];
export type EquipmentType = Schemas['EquipmentType'];

// Bookings
export type Booking = Schemas['Booking'];
export type AdminBooking = Schemas['AdminBooking'];
export type NewBooking = Schemas['NewBooking'];
export type BookingStatus = Schemas['BookingStatus'];
export type BookingRules = Schemas['BookingRules'];
export type BookingPage = Schemas['BookingPage'];
export type AdminBookingPage = Schemas['AdminBookingPage'];

// Grants
export type Grant = Schemas['Grant'];
export type AdminGrant = Schemas['AdminGrant'];
export type GrantType = Schemas['GrantType'];

// Errors
export type Problem = Schemas['Problem'];
