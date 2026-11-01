import { useReducer } from 'react';

export function useRefresh(): () => void {
    const [, refresh] = useReducer((count: number) => count + 1, 0);
    return refresh;
}
