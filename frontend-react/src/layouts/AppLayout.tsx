import { Link, NavLink, Outlet, useNavigate, useNavigation } from 'react-router';
import { useAuth, useCurrentUser } from '../auth/AuthContext.ts';
import { SYSTEM_GRANTS } from '../grants.ts';
import { Button } from '../components/ui/Button.tsx';
import { cn } from '../utils/cn.ts';

interface NavItem {
    to: string;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
    { to: '/rooms', label: 'Find a room' },
    { to: '/bookings', label: 'My bookings' },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
    { to: '/admin/rooms', label: 'Manage rooms' },
    { to: '/admin/bookings', label: 'All bookings' },
    { to: '/admin/grants', label: 'Grants and users' },
];

const tabClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
        'block border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors',
        isActive
            ? 'border-brand text-neutral-100'
            : 'border-transparent text-muted hover:text-neutral-100',
    );

export function AppLayout() {
    const { logout, hasGrant } = useAuth();
    const navigate = useNavigate();
    const user = useCurrentUser();
    const navigation = useNavigation();

    const navItems = hasGrant(SYSTEM_GRANTS.ADMIN) ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

    function handleLogout() {
        logout();
        navigate('/');
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b border-border bg-neutral-950/80 backdrop-blur">
                {navigation.state === 'loading' && (
                    <div
                        role="status"
                        className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-brand"
                    >
                        <span className="sr-only">Loading…</span>
                    </div>
                )}

                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
                    <Link to="/rooms" className="flex items-center gap-2.5">
                        <span className="size-7 rounded-lg bg-brand" aria-hidden="true" />
                        <span className="font-semibold tracking-tight">Office Room Booking</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-muted sm:inline">
                            {user.firstName} {user.lastName}
                        </span>
                        <Button size="sm" onClick={handleLogout}>
                            Log out
                        </Button>
                    </div>
                </div>

                <nav aria-label="Main" className="mx-auto max-w-6xl px-6">
                    <ul className="flex gap-1 overflow-x-auto">
                        {navItems.map((navItem: NavItem) => (
                            <li key={navItem.to}>
                                <NavLink to={navItem.to} className={tabClasses}>
                                    {navItem.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}
