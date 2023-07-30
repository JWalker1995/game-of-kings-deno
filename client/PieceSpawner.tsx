import React from 'react';

import { userId } from './user.ts';
import HexPoly from './HexPoly.tsx';
import { Match } from '~/common/types.ts';

const colors = ['#4771b2', '#cf3759'];

const PieceSpawner = ({
  spawnsAvailable,
  playerIndex,
  onMouseDown,
}: {
  spawnsAvailable: number;
  playerIndex: number;
  onMouseDown?: () => void;
}) => (
  <div
    style={{
      flex: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg
      viewBox='-1.1 -1.1 2.2 2.2'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      style={{
        width: 50,
        height: 50,
      }}
    >
      <HexPoly
        cell={{ x: 0, y: 0 }}
        fill={colors[playerIndex]}
        scale={1}
        onMouseDown={onMouseDown && spawnsAvailable > 0
          ? (e) => {
            e.preventDefault();
            onMouseDown();
          }
          : undefined}
        style={onMouseDown && spawnsAvailable > 0 ? { cursor: 'grab' } : {}}
      />
    </svg>
    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
      x{spawnsAvailable}
    </span>
  </div>
);

export default PieceSpawner;
