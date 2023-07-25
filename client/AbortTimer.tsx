import React from 'react';
import { Progress, Segment } from 'semantic-ui-react';

// import { ABORT_TIMEOUT, Match } from 'game-of-kings-common';

import { CountdownTimer, PausedTimer, RendererProps } from './Timer.tsx';
import { ABORT_TIMEOUT } from '~/common/constants.ts';
import { Match } from '~/common/types.ts';

const AbortTimer = ({
  match,
  playerIndex,
}: {
  match: Match;
  playerIndex: number;
}) =>
  match.playerToMove === playerIndex &&
    match.status === 'playing' &&
    match.log.length < (match.variant.formation === 'tutorial' ? 1 : 2)
    ? (
      <CountdownTimer
        endTime={match.moveStartDate + ABORT_TIMEOUT}
        totalTimeMs={ABORT_TIMEOUT}
        renderer={({ seconds }: RendererProps) => (
          <em style={{ fontSize: '12px' }}>
            {seconds} seconds to make first move
          </em>
        )}
      />
    )
    : null;

export default AbortTimer;
