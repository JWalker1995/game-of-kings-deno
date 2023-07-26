import React from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'semantic-ui-react';

import { userId } from './user.ts';
import { useModule } from './socket.ts';
import UserBadge from './UserBadge.tsx';
import VariantDescription from './VariantDescription.tsx';
import { MatchModule, UNINITIALIZED } from '~/common/modules.ts';

/*
	variant: VariantCodec,
	log: t.array(DoMoveCodec),
	players: t.array(
		t.strict({
			userId: t.string,
			spawnsAvailable: t.number,
			timeForMoveMs: t.number,
		}),
	),
	playerToMove: t.number,
	moveStartDate: t.number,
	cells: t.array(orNull(PieceCodec)),
	chat: t.array(ChatCodec),
	status: t.keyof({
		playing: null,
		aborted: null,
		drawn: null,
		checkmate: null,
		timeout: null,
	}),
	winner: opt(t.number),
*/

const MatchItem = ({ matchId }: { matchId: string }) => {
  const navigate = useNavigate();

  const match = useModule(`match-${matchId}`, MatchModule);

  if (match === UNINITIALIZED) {
    return <>Loading...</>;
  }

  const { variant, log, players, status, winner } = match;

  return (
    <List.Item
      key={matchId}
      onClick={() => navigate(`/match/${matchId}`)}
    >
      <div className='challenge'>
        <List.Header>
          <UserBadge userId={players[0].userId} /> vs{' '}
          <UserBadge userId={players[1].userId} />
        </List.Header>

        <List.Description>
          <VariantDescription {...variant} />
          <br />
          {log.length} moves
          {winner !== undefined
            ? (
              <>
                ; won by <UserBadge userId={players[winner].userId} />
              </>
            )
            : (
              `; ${status}`
            )}
        </List.Description>
      </div>
    </List.Item>
  );
};

export default MatchItem;
