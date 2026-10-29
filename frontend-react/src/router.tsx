import { createBrowserRouter, redirect } from 'react-router';
import { AdminBookingsPage } from './pages/AdminBookingsPage';
import { AdminGrantsPage } from './pages/AdminGrantsPage';
import { AdminRoomsPage } from './pages/AdminRoomsPage';
import { LoginPage } from './pages/LoginPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { RoomSearchPage } from './pages/RoomSearchPage';
import { AppLayout } from './layouts/AppLayout';
import { RequireGrant } from './auth/RequireGrant.tsx';
import { SYSTEM_GRANTS } from './grants.ts';
import { RequireAuth } from './auth/RequireAuth.tsx';

export const router = createBrowserRouter([
    { path: '/', loader: () => redirect('/rooms') },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    {
        element: <RequireAuth />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { path: '/rooms', element: <RoomSearchPage /> },
                    { path: '/rooms/:roomId', element: <RoomDetailsPage /> },
                    { path: '/bookings', element: <MyBookingsPage /> },
                    {
                        element: <RequireGrant code={SYSTEM_GRANTS.ADMIN} />,
                        children: [
                            { path: '/admin/rooms', element: <AdminRoomsPage /> },
                            { path: '/admin/bookings', element: <AdminBookingsPage /> },
                            { path: '/admin/grants', element: <AdminGrantsPage /> },
                        ],
                    },
                ],
            },
        ],
    },

    { path: '*', element: <NotFoundPage /> },
]);
