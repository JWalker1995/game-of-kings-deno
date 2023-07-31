import React from 'react';

import RenameModal from './RenameModal.tsx';
import UserBadge from './UserBadge.tsx';
import { userId } from '~/client/user.ts';
import GithubMark from '~/client/GithubMark.tsx';
import RulesModal from '~/client/RulesModal.tsx';
import { OpenRulesModalContext } from '~/client/context.ts';

export default () => (
  <div
    style={{
      height: '50px',
      backgroundColor: 'white',
      boxShadow: '0 0 8px 0 gray',
      zIndex: 4,
      display: 'flex',
      alignItems: 'center',
      padding: '16px',

      backgroundImage: `url(/bow-icon.png)`,
      backgroundSize: 'auto 80%',
      backgroundPosition: 'left center',
      backgroundRepeat: 'no-repeat',
      paddingLeft: '40px',
    }}
  >
    <h1
      style={{
        margin: '0',
        fontSize: '20px',
        verticalAlign: 'middle',
      }}
    >
      <a href='/' style={{ color: 'black' }}>
        gameofkings.io
      </a>
    </h1>
    <div style={{ flex: '1' }}></div>
    {
      /*
    <LoginModal />
    <div style={{ padding: '0.5em' }}>|</div>
    <RegisterModal />
    */
    }
    <UserBadge userId={userId} />
    <div style={{ padding: '0.5em' }}>|</div>
    <RenameModal />
    <div style={{ padding: '0.5em' }}>|</div>
    <div
      style={{ cursor: 'pointer' }}
      onClick={React.useContext(OpenRulesModalContext).bind(null, true)}
    >
      Rules
    </div>
    <div style={{ padding: '0.5em' }}>|</div>
    <a href='https://github.com/JWalker1995/game-of-kings-deno' target='_blank'>
      <GithubMark size={20} />
    </a>
  </div>
);
