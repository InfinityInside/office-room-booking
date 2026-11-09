import {
    addDays,
    addMinutesToTime,
    minutesToTime,
    timeOptions,
    timeToMinutes,
    todayInput,
} from './utils/time';

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

const DEFAULT_SEARCH_MINUTES = 60;

/**
 * A sensible first search: the next full hour today, for one hour, within opening hours.
 * If today's last possible start has passed, tomorrow at opening time.
 */
export function defaultSearchSlot(): { date: string; startTime: string; endTime: string } {
    const now = new Date();
    const nextFullHour = (now.getHours() + 1) * 60; // minutes since midnight
    const latestStart = timeToMinutes(closeTime) - DEFAULT_SEARCH_MINUTES;

    if (nextFullHour <= latestStart) {
        const start = Math.max(nextFullHour, timeToMinutes(openTime));
        return {
            date: todayInput(),
            startTime: minutesToTime(start),
            endTime: minutesToTime(start + DEFAULT_SEARCH_MINUTES),
        };
    }

    return {
        date: addDays(todayInput(), 1),
        startTime: openTime,
        endTime: addMinutesToTime(openTime, DEFAULT_SEARCH_MINUTES),
    };
}