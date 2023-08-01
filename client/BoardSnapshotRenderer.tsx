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
import { Label } from 'semantic-ui-react';
import PieceSpawner from '~/client/PieceSpawner.tsx';
import Svg, { ViewBox } from '~/client/Svg.tsx';

const variantDecoder = makeDecoder(VariantCodec);

export default ({
  radius,
  viewBox,
  style,
  formation,
  infos = [],
  selectedCell = '0,0,0',
  showSpawns = false,
  onlyLegalMoves = false,
  playerIndex = 0,
}: {
  radius: number;
  viewBox: ViewBox;
  style?: React.CSSProperties;
  formation: Formation;
  infos?: { at: string; text: string; heightOffset?: number }[];
  selectedCell?: string;
  showSpawns?: boolean;
  onlyLegalMoves?: boolean;
  playerIndex?: number;
}) => {
  const variant = variantDecoder({
    radius,
    formation: onlyLegalMoves ? 'monarchy' : 'tutorial',
    spawnsAvailable: 0,
    timeInitialMs: 0,
    timeIncrementMs: 0,
    stakes: 0,
  });
  const board = getBoard(variant);
  const cells = board.map((cell) =>
    formation[`${cell.q},${cell.r},${cell.s}`] || null
  );
  const validMoves = enumerateLegalMoves({
    variant,
    players: [{ spawnsAvailable: 1 }, { spawnsAvailable: 1 }],
    playerToMove: 0,
    cells,
  });
  const checkMoves = onlyLegalMoves
    ? [
      ...validMoves,
      ...enumerateLegalMoves({
        variant,
        players: [{ spawnsAvailable: 1 }, { spawnsAvailable: 1 }],
        playerToMove: 1,
        cells,
      }),
    ]
    : [];

  const selectedCellIndex = cells.indexOf(formation[selectedCell]);

  const infoMap = Object.fromEntries(infos.map((info) => {
    const [el, setEl] = React.useState<SVGElement | null>(null);
    return [info.at, { ...info, el, setEl }];
  }));

  // const viewCoords = viewBox.split(' ');
  // const viewRect = (
  //   <rect
  //     x={viewCoords[0]}
  //     y={viewCoords[1]}
  //     width={viewCoords[2]}
  //     height={viewCoords[3]}
  //     fill='none'
  //     stroke='red'
  //     strokeWidth='0.1'
  //   />
  // );
  const viewRect = undefined;

  return (
    <>
      <Svg viewBox={viewBox} style={style}>
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

        {cells.map((_cell, index) => {
          const move = validMoves.find(
            (m) =>
              m.type === (showSpawns ? 'spawnPiece' : 'movePiece') &&
              m.fromIndex === selectedCellIndex && m.toIndex === index,
          );

          return (
            <HexPoly
              key={index}
              cell={board[index]}
              fill={move ? '#E0E0E0' : '#C0C0C0'}
              scale={1}
              onMouseDown={() =>
                console.log(
                  index,
                  `${board[index].q},${board[index].r},${board[index].s}`,
                )}
              ref={(el) =>
                infoMap[`${board[index].q},${board[index].r},${board[index].s}`]
                  ?.setEl(el)}
            />
          );
        })}

        {cells.map((cell, index) => {
          if (!cell) {
            return undefined;
          }

          return (
            <HexPoly
              key={index}
              cell={board[index]}
              fill={chroma(colors[cell.playerIndex]).hex()}
              scale={1}
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

        {showSpawns
          ? (
            <>
              <HexPoly
                cell={{ x: radius * 2 + 2, y: 0 }}
                fill={colors[playerIndex]}
                scale={1}
              />
              <text
                x={radius * 2 + 3}
                y={0}
                style={{ fontWeight: 'bold', fontSize: '0.5px' }}
                dominantBaseline='middle'
              >
                x12
              </text>
            </>
          )
          : undefined}

        {validMoves.map((m) => {
          if (
            m.type === (showSpawns ? 'spawnPiece' : 'movePiece') &&
            m.fromIndex === selectedCellIndex
          ) {
            let { x: sx, y: sy } = showSpawns
              ? { x: radius * 2 + 2, y: 0 }
              : board[m.fromIndex];
            let { x: ex, y: ey } = board[m.toIndex];
            let dx = ex - sx;
            let dy = ey - sy;
            const d = Math.sqrt(dx * dx + dy * dy);
            dx /= d;
            dy /= d;
            sx += dx * 0.5;
            sy += dy * 0.5;
            ex -= dx * 0.25;
            ey -= dy * 0.25;
            return (
              <path
                id='arrow-line'
                marker-end='url(#head)'
                stroke-width='0.2'
                fill='none'
                stroke='#478778FF'
                d={`M${sx},${sy} L${ex},${ey}`}
              />
            );
          }
        })}

        {viewRect}
      </Svg>

      {Object.values(infoMap).map((info) => {
        if (info.el) {
          const elRect = info.el.getBoundingClientRect();
          const parentRect = info.el.parentElement!.parentElement!
            .getBoundingClientRect();
          return (
            <div
              style={{
                position: 'absolute',
                top: elRect.top +
                  elRect.height * (.75 + (info.heightOffset ?? 0)) -
                  parentRect.top,
                left: elRect.left + elRect.width * .5 - parentRect.left,
              }}
            >
              <Label
                pointing
                size='large'
                style={{
                  position: 'relative',
                  zIndex: 100,
                  left: '-50%',
                  border: '1px solid gray',
                  textAlign: 'center',
                }}
              >
                {info.text}
              </Label>
            </div>
          );
        }
      })}
    </>
  );
};
