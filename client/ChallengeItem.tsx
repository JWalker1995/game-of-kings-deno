import React from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import { List } from 'semantic-ui-react';

import { userId } from './user.ts';
import { send } from './socket.ts';
import UserBadge from './UserBadge.tsx';
import VariantDescription from './VariantDescription.tsx';
import { Challenge } from '~/common/types.ts';

const ChallengeItem = ({
  id,
  challengerId,
  opponentId,
  variant,
  matchId,
}: Challenge) => {
  const wasChallenge = React.useRef(false);
  const navigate = useNavigate();

  if (matchId) {
    if (
      wasChallenge.current && (challengerId === userId || opponentId === userId)
    ) {
      navigate(`/match/${matchId}`);
    }
    wasChallenge.current = false;
    return <></>;
  }

  wasChallenge.current = true;

  return (
    <List.Item
      key={id}
      onClick={challengerId === userId
        ? () => send('retractChallenge', id)
        : () =>
          send('acceptChallenge', {
            challengeId: id,
            acceptorId: userId,
          })}
    >
      <div className='challenge'>
        <List.Header>
          vs <UserBadge userId={challengerId} />
        </List.Header>

        <List.Description>
          <VariantDescription {...variant} />
        </List.Description>
      </div>
    </List.Item>
  );
};

export default ChallengeItem;
