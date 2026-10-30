import { useState, type ReactNode } from 'react';
import * as api from '../api/mockApi';
import { AuthContext, type RegisterInput } from './AuthContext';
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

    function register(input: RegisterInput): void {
        // The mock doesn't store passwords; the real backend will hash and store it.
        const created = api.register({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
        });
        setUserId(created.id);
    }

    function logout() {
        setUserId(null);
    }

    function hasGrant(code: SystemGrantCode): boolean {
        return user !== null && api.hasGrant(user, code);
    }

    const value = { user, hasGrant, login, register,  logout };

    return <AuthContext value={value}>{children}</AuthContext>;
}