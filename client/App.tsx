import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Header from './Header.tsx';
import Match from './Match.tsx';
import Lobby from './Lobby.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <Header />
        <Lobby />
      </>
    ),
  },
  {
    path: '/match/:matchId',
    element: (
      <>
        <Header />
        <Match />
      </>
    ),
  },
]);

const App = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <RouterProvider router={router} />
  </div>
);

export default App;
