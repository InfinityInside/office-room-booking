import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

/** Renders the child routes only for a logged-in user; otherwise sends them to /login. */
export function RequireAuth() {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to='/login' replace state={{ from: location.pathname }} />
    }

    return <Outlet />;
}
