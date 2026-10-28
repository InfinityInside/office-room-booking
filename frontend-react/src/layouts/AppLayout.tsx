import { NavLink, Outlet } from 'react-router';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
});

export function AppLayout() {
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
            </header>
            <hr />
            <main>
                <Outlet />
            </main>
        </>
    );
}
