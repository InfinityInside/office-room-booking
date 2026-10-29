import { Outlet } from 'react-router';
import type { SystemGrantCode } from '../grants';
import { useAuth } from './AuthContext';

interface RequireGrantProps {
    code: SystemGrantCode;
}

/** Renders the child routes only for users holding the given system grant. */
export function RequireGrant({ code }: RequireGrantProps) {
    const { hasGrant } = useAuth();

    if (!hasGrant(code)) {
        return (
            <>
                <h1>No access</h1>
                <p>You don't have permission to open this page.</p>
            </>
        );
    }

    return <Outlet />;
}
