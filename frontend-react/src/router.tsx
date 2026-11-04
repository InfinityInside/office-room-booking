import { createBrowserRouter, redirect } from 'react-router';
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
import { ErrorPage } from './pages/ErrorPage.tsx';

export const router = createBrowserRouter([
    {
        errorElement: <ErrorPage />,
        hydrateFallbackElement: <p>Loading...</p>,
        children: [
            { path: '/', loader: () => redirect('/rooms') },
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
            { path: '*', element: <NotFoundPage /> },
            {
                element: <RequireAuth />,
                children: [
                    {
                        element: <AppLayout />,
                        children: [
                            {
                                errorElement: <ErrorPage />,
                                children: [
                                    { path: '/rooms', element: <RoomSearchPage /> },
                                    { path: '/rooms/:roomId', element: <RoomDetailsPage /> },
                                    { path: '/bookings', element: <MyBookingsPage /> },
                                    {
                                        element: <RequireGrant code={SYSTEM_GRANTS.ADMIN} />,
                                        children: [
                                            {
                                                path: '/admin/rooms',
                                                lazy: async () => ({
                                                    Component: (
                                                        await import('./pages/AdminRoomsPage')
                                                    ).AdminRoomsPage,
                                                }),
                                            },
                                            {
                                                path: '/admin/bookings',
                                                lazy: async () => ({
                                                    Component: (
                                                        await import('./pages/AdminBookingsPage')
                                                    ).AdminBookingsPage,
                                                }),
                                            },
                                            {
                                                path: '/admin/grants',
                                                lazy: async () => ({
                                                    Component: (
                                                        await import('./pages/AdminGrantsPage')
                                                    ).AdminGrantsPage,
                                                }),
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
]);
