import React from 'react';
import { useParams } from 'react-router-dom';

import { useModule } from './socket.ts';
import Board from './Board.tsx';
import { MatchModule, UNINITIALIZED } from '~/common/modules.ts';

const Match = () => {
  const { matchId } = useParams();
  const match = useModule(`match-${matchId}`, MatchModule);

  if (match === UNINITIALIZED) {
    return <>Loading...</>;
  } else {
    return <Board matchId={matchId!} match={match} />;
  }
};

export default Match;
