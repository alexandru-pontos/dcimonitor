import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import RackList from './pages/RackList';
import RackView from './pages/RackView';
import DeviceList from './pages/DeviceList';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: 'racks',
                element: <RackList />,
            },
            {
                path: 'racks/:rackId',
                element: <RackView />,
            },
            {
                path: 'devices',
                element: <DeviceList />,
            },
            {
                path: 'settings',
                element: <Settings />,
            },
        ],
    },
]);

export default function AppRouter() {
    return <RouterProvider router={router} />;
}
