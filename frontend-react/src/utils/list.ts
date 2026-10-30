/** Adds the item if it's missing, removes it if it's there. Returns a new array. */
export function toggleItem<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
