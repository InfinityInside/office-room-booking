export const SYSTEM_GRANTS = {
    ADMIN: 'ADMIN',
} as const;

export type SystemGrantCode = (typeof SYSTEM_GRANTS)[keyof typeof SYSTEM_GRANTS];
