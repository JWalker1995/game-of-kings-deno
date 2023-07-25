import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

import Header from './Header.tsx';
import Match from './Match.tsx';
import Lobby from './Lobby.tsx';

const App = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <BrowserRouter>
      <Switch>
        <Route path='/match/:matchId'>
          <Header />
          <Match />
        </Route>
        <Route path='/'>
          <Header />
          <Lobby />
        </Route>
      </Switch>
    </BrowserRouter>
  </div>
);

export default App;
