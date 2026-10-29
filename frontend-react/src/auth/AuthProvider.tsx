import { useState, type ReactNode } from 'react';
import * as api from '../api/mockApi';
import { AuthContext } from './AuthContext';
import type { SystemGrantCode } from '../grants.ts';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [userId, setUserId] = useState<number | null>(null);
    const user = userId === null ? null : (api.getUser(userId) ?? null);

    function login(email: string, password: string): boolean {
        const found = api.login(email, password);
        if (found) {
            setUserId(found.id);
        }
        return found !== null;
    }

    function logout() {
        setUserId(null);
    }

    function hasGrant(code: SystemGrantCode): boolean {
        return user !== null && api.hasGrant(user, code);
    }

    const value = { user, hasGrant, login, logout };

    return <AuthContext value={value}>{children}</AuthContext>;
}