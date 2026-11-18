import type { RouteObject } from 'react-router-dom';
import Layout from './components/Layout';
import Placeholder from './components/Placeholder';
import Login from './pages/Login';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Placeholder name="Home" /> },
      { path: '/ideas', element: <Placeholder name="Ideas" /> },
      { path: '/ideas/rank', element: <Placeholder name="Rank" /> },
      { path: '/ideas/:slug', element: <Placeholder name="Idea" /> },
      { path: '/links', element: <Placeholder name="Links" /> },
      { path: '/settings', element: <Placeholder name="Settings" /> },
      { path: '/login', element: <Login /> },
    ],
  },
];
