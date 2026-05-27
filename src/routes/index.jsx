import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import Categories from '../pages/Categories';
import CategoryTopics from '../pages/CategoryTopics';
import TopicDetail from '../pages/TopicDetail';
import DSAOverview from '../pages/DSAOverview';
import DSATopicDetail from '../pages/DSATopicDetail';
import Bookmarks from '../pages/Bookmarks';
import RecentlyViewed from '../pages/RecentlyViewed';
import Progress from '../pages/Progress';
import Settings from '../pages/Settings';
import NewTopic from '../pages/NewTopic';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'categories', element: <Categories /> },
      { path: 'category/:slug', element: <CategoryTopics /> },
      { path: 'topic/new', element: <NewTopic /> },
      { path: 'topic/:slug', element: <TopicDetail /> },
      { path: 'dsa', element: <DSAOverview /> },
      { path: 'dsa/:slug', element: <DSATopicDetail /> },
      { path: 'bookmarks', element: <Bookmarks /> },
      { path: 'recent', element: <RecentlyViewed /> },
      { path: 'progress', element: <Progress /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
