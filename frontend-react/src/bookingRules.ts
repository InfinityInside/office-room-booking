import { addMinutesToTime, timeOptions } from './utils/time';


export const BOOKING_RULES = {
    openTime: '07:00',
    closeTime: '20:00',
    stepMinutes: 15,
    minMinutes: 15,
    maxMinutes: 240,
    maxDaysAhead: 30,
} as const;

const { openTime, closeTime, stepMinutes } = BOOKING_RULES;

/** Times a booking may start at: 07:00, 07:15, ... 19:45 */
export const START_TIMES = timeOptions(
    openTime,
    addMinutesToTime(closeTime, -stepMinutes),
    stepMinutes,
);

/** Times a booking may end at: 07:15, 07:30, ... 20:00 */
export const END_TIMES = timeOptions(
    addMinutesToTime(openTime, stepMinutes),
    closeTime,
    stepMinutes,
);
