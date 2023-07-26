import React from 'react';
import { List } from 'semantic-ui-react';

import ChallengeItem from './ChallengeItem.tsx';
import { LobbyState } from '~/common/types.ts';

export default ({
  challenges,
  users,
}: {
  challenges: LobbyState['challenges'];
  users: LobbyState['users'];
}) => (
  <List divided relaxed>
    {challenges.map(ChallengeItem)}
  </List>
);
