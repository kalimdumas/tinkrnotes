import { RouterProvider } from './lib/router';
import Board from './routes/index';
import StackPage from './routes/stack';
import NotePage from './routes/note';

export default function App() {
  const routes = [
    { path: '/', component: Board },
    { path: '/stack/:id', component: StackPage },
    { path: '/note/:id', component: NotePage },
  ];
  return <RouterProvider routes={routes} />;
}
