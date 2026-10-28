import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext.ts';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
});

export function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/');
    }

    return (
        <>
            <header>
                <strong>Office Room Booking</strong>
                <nav>
                    <ul>
                        <li>
                            <NavLink to="/rooms" style={linkStyle}>
                                Find a room
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/bookings" style={linkStyle}>
                                My bookings
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/rooms" style={linkStyle}>
                                Manage rooms
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/bookings" style={linkStyle}>
                                All bookings
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/grants" style={linkStyle}>
                                Grants and users
                            </NavLink>
                        </li>
                    </ul>
                </nav>
                {user ? (
                    <p>
                        Logged in as {user.firstName} {user.lastName}
                        <button onClick={handleLogout}>
                            Log out
                        </button>
                    </p>
                ) : (
                    <p>
                        <Link to="/login">Log in</Link>
                    </p>
                )}
            </header>
            <hr />
            <main>
                <Outlet />
            </main>
        </>
    );
}
