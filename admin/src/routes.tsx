import type { RouteObject } from 'react-router-dom';
import Layout from './components/Layout';
import Placeholder from './components/Placeholder';
import Home from './pages/Home';
import IdeaDetail from './pages/IdeaDetail';
import Ideas from './pages/Ideas';
import Links from './pages/Links';
import Login from './pages/Login';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/ideas', element: <Ideas /> },
      { path: '/ideas/rank', element: <Placeholder name="Rank" /> },
      { path: '/ideas/:slug', element: <IdeaDetail /> },
      { path: '/links', element: <Links /> },
      { path: '/settings', element: <Placeholder name="Settings" /> },
      { path: '/login', element: <Login /> },
    ],
  },
];
