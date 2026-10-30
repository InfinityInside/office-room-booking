import { createContext, useContext } from 'react';
import type { User } from '../types';
import type { SystemGrantCode } from '../grants.ts';

export interface AuthContextValue {
    user: User | null;
    hasGrant: (code: SystemGrantCode) => boolean;
    login: (email: string, password: string) => boolean;
    register: (input: RegisterInput) => void;
    logout: () => void;
}

export interface RegisterInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Gives any component access to the logged-in user and the login/logout functions. */
export function useAuth(): AuthContextValue {
    const value = useContext(AuthContext);
    if (!value) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return value;
}

export function useCurrentUser(): User {
    const { user } = useAuth();

    if (!user) {
        throw new Error('useCurrentUser must be used inside <AuthProvider>');
    }

    return user;
}
