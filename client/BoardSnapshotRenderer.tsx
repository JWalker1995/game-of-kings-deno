import React from 'react';
import chroma from 'chroma-js';

import HexPoly, { hexStaticBlock } from '~/client/HexPoly.tsx';
import { Piece } from '~/common/types.ts';
import { colors } from '~/client/Board.tsx';
import { getBoard } from '~/common/board.ts';
import { Formation } from '~/common/cells.ts';
import { enumerateLegalMoves } from '~/common/moves.ts';
import { getPriorState } from '~/common/match.ts';
import { makeDecoder } from '~/common/coder.ts';
import { NonNegIntCodec, VariantCodec } from '~/common/codecs.ts';

const baseVariant = makeDecoder(VariantCodec)({
  radius: 0,
  formation: 'monarchy',
  spawnsAvailable: 0,
  timeInitialMs: 0,
  timeIncrementMs: 0,
  stakes: 0,
});
const radiusDecoder = makeDecoder(NonNegIntCodec);

const selectedCellIndex = 0;
const selfPlayerIndex = 0;

export default (
  { size, formation }: { size: number; formation: Formation },
) => {
  const variant = { ...baseVariant, radius: radiusDecoder(size) };
  const board = getBoard(variant);
  const cells = board.map((cell) =>
    formation[`${cell.q},${cell.r},${cell.s}`] || null
  );
  const validMoves = enumerateLegalMoves({
    variant,
    players: [{ spawnsAvailable: 0 }, { spawnsAvailable: 0 }],
    playerToMove: 0,
    cells,
  });
  const checkMoves = validMoves.filter(() => false);

  return (
    <svg
      viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      style={{
        flex: '1',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {hexStaticBlock()}

      <defs>
        <marker
          id='head'
          orient='auto'
          markerWidth='3'
          markerHeight='4'
          refX='1'
          refY='2'
        >
          <path d='M0,0 V4 L2,2 Z' fill='#478778FF' />
        </marker>
      </defs>

      <filter
        id='hex-glow'
        x='-0.43301270189'
        y='-0.5'
        width='1.73205080757'
        height='2'
      >
        <feFlood floodColor={chroma(colors[0]).brighten().hex()} />
        <feComposite in2='SourceGraphic' operator='out' />
        <feGaussianBlur stdDeviation='0.1' />
        <feComponentTransfer>
          <feFuncA type='linear' slope='2' />
        </feComponentTransfer>
        <feComposite operator='in' in2='SourceGraphic' />
      </filter>

      {cells.map((cell, index) => {
        return (
          <HexPoly
            key={index}
            cell={board[index]}
            fill={'#C0C0C0'}
            scale={1}
          />
        );
      })}

      {cells.map((cell, index) => {
        if (!cell) {
          return undefined;
        }

        const move = validMoves.find(
          (m) =>
            m.type === 'movePiece' &&
            m.fromIndex === selectedCellIndex &&
            m.toIndex === index,
        );

        let color = chroma(colors[cell.playerIndex]);
        if (move) {
          color = color.darken();
        }

        return (
          <HexPoly
            key={index}
            cell={board[index]}
            fill={color.hex()}
            scale={index === selectedCellIndex ? 0.8 : 1}
            style={cell.playerIndex === selfPlayerIndex
              ? { cursor: 'grab' }
              : undefined}
            text={cell.type === 'king' ? '♔' : undefined}
            textColor={cell.type === 'king' &&
                checkMoves.some((m) =>
                  m.type === 'movePiece' && m.toIndex === index
                )
              ? 'purple'
              : 'black'}
          />
        );
      })}

      {board[4].neighborIndices.map((idx) => {
        let { x: sx, y: sy } = board[4];
        let { x: ex, y: ey } = board[idx];
        sx = sx * 0.6 + ex * (1 - 0.6);
        sy = sy * 0.6 + ey * (1 - 0.6);
        ex = sx * 0.1 + ex * (1 - 0.1);
        ey = sy * 0.1 + ey * (1 - 0.1);
        return (
          <path
            id='arrow-line'
            marker-end='url(#head)'
            stroke-width='0.15'
            fill='none'
            stroke='#478778FF'
            d={`M${sx},${sy} L${ex},${ey}`}
          />
        );
      })}
    </svg>
  );
};
