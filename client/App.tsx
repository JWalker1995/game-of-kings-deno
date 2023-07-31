import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import Header from './Header.tsx';
import Match from './Match.tsx';
import Lobby from './Lobby.tsx';
import { OpenRulesModalContext } from '~/client/context.ts';
import RulesModal from '~/client/RulesModal.tsx';

const router = createHashRouter([
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

const App = () => {
  const [isRulesOpen, setRulesOpen] = React.useState<boolean>(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <RulesModal open={isRulesOpen} setOpen={setRulesOpen} />
      <OpenRulesModalContext.Provider value={setRulesOpen}>
        <RouterProvider router={router} />
      </OpenRulesModalContext.Provider>
    </div>
  );
};

export default App;
