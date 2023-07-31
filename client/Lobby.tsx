import React from 'react';
import { Button, Header, List, Segment } from 'semantic-ui-react';

import ChallengeItem from './ChallengeItem.tsx';
import MatchItem from './MatchItem.tsx';
import CreateGameModal from './CreateGameModal.tsx';
import { useModule } from './socket.ts';
import { LobbyModule } from '~/common/modules.ts';

const Lobby = () => {
  const { users, challenges, liveMatchIds, recentMatchIds } = useModule(
    'lobby',
    LobbyModule,
  );

  return (
    <div
      style={{
        flex: '1',
        background: `radial-gradient(#fff, #ccc)`,
      }}
    >
      {
        /*<Button primary fluid onClick={() => {}}>
        Rules
      </Button>*/
      }

      <Segment
        style={{
          margin: '20px auto',
          maxWidth: '800px',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            flex: '1',
          }}
        >
          <Header style={{ borderBottom: '1px solid silver' }}>
            Challenges
          </Header>

          <List divided relaxed>
            {challenges.map((challenge) => <ChallengeItem {...challenge} />)}
          </List>

          <CreateGameModal />
        </div>

        <div
          style={{
            backgroundColor: 'silver',
            width: '1px',
            margin: '0px 8px',
          }}
        >
        </div>

        <div
          style={{
            flex: '1',
          }}
        >
          <Header style={{ borderBottom: '1px solid silver' }}>
            Live Games
          </Header>
          <List divided relaxed>
            {liveMatchIds.map((matchId) => <MatchItem matchId={matchId} />)}
          </List>

          <Header style={{ borderBottom: '1px solid silver' }}>
            Recent Games
          </Header>
          <List divided relaxed>
            {recentMatchIds.slice(0, 4).map((matchId) => (
              <MatchItem matchId={matchId} />
            ))}
          </List>
        </div>
      </Segment>
    </div>
  );
};

export default Lobby;
