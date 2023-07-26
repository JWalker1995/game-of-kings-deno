import * as t from 'io-ts';

import { tutorialUserId } from './auth.ts';
import {
  createModuleInstance,
  getModuleInstance,
  ModuleInstance,
} from './modules.ts';
import { ABORT_TIMEOUT } from '~/common/constants.ts';
import { makeDecoder } from '~/common/coder.ts';
import { MoveCodec } from '~/common/codecs.ts';
import { LobbyModule, MatchModule, UserModule } from '~/common/modules.ts';
import { makeCells } from '~/common/cells.ts';
import { enumerateLegalMoves } from '~/common/moves.ts';
import { Room, RoomImpl } from '~/server/Room.ts';
import { LobbyState } from '~/common/types.ts';

const shuffleInPlace = <T>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const hasOwnProperty = <X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> => obj.hasOwnProperty(prop);

const moveDecoder = makeDecoder(
  t.intersection([MoveCodec, t.type({ matchId: t.string })]),
);
const matchTimeouts = new Map<string, number>();

(async () => {
  const lobby = new RoomImpl<LobbyState>(LobbyModule);

  const lobby = await createModuleInstance('lobby', LobbyModule);

  io.on('connection', async (socket) => {
    const userId = socket.handshake.auth.userId;

    const user = await createModuleInstance(`user-${userId}`, UserModule);

    socket.on('renameUser', (data) => user.actors.update({ username: data }));

    socket.on('extendChallenge', lobby.actors.extendChallenge);
    socket.on('lobby-retract-challenge', lobby.actors.retractChallenge);

    socket.on('lobby-accept-challenge', async (data: any) => {
      const challenge = lobby
        .getState()
        .challenges.find((c) => c.id === data.challengeId);
      if (!challenge) {
        throw new Error(`Invalid challengeId: ${data.challengeId}`);
      }

      const matchId = crypto.randomUUID();

      const players = [challenge.challengerId, userId].map((userId) => ({
        userId,
        spawnsAvailable: challenge.variant.spawnsAvailable,
        timeForMoveMs: challenge.variant.timeInitialMs,
      }));

      const match = await createModuleInstance(`match-${matchId}`, MatchModule);
      await match.actors.reset({
        variant: challenge.variant,
        log: [],
        players: challenge.challengerId === tutorialUserId
          ? players
          : shuffleInPlace(players),
        playerToMove: 0,
        moveStartDate: Date.now(),
        cells: makeCells(challenge.variant),
        chat: [],
        status: 'playing',
        winner: undefined,
      });

      await lobby.actors.acceptChallenge({
        ...data,
        acceptDate: Date.now(),
        matchId,
      });

      await preMove(matchId, match);
    });

    socket.on('match-do-move', async (data: any) => {
      data = { ...data, date: Date.now() };
      const { type, matchId } = moveDecoder(data);

      const match = await getModuleInstance(`match-${matchId}`, MatchModule);

      {
        const { players, playerToMove, status } = match.getState();

        if (status !== 'playing') {
          throw new Error(`You cannot move in an ${status} match`);
        }

        if (players[playerToMove].userId !== userId) {
          throw new Error(`You cannot move for that player`);
        }

        const candidateMoves = enumerateLegalMoves(match.getState());

        if (
          !candidateMoves.some((m) =>
            Object.entries(m).every(([k, v]) => data[k] === v)
          )
        ) {
          throw new Error(`Invalid move: ${JSON.stringify(data)}`);
        }
      }

      if (matchTimeouts.has(matchId)) {
        clearTimeout(matchTimeouts.get(matchId)!);
        matchTimeouts.delete(matchId);
      }

      await match.actors.doMove(data);

      await preMove(matchId, match);
    });

    const preMove = async (
      matchId: string,
      match: ModuleInstance<
        (typeof MatchModule)['initialState'],
        (typeof MatchModule)['reducers']
      >,
    ) => {
      const endMatch = async () => {
        const { variant, players, status, winner } = match.getState();

        if (['drawn', 'checkmate', 'timeout'].includes(status)) {
          const users = await Promise.all(
            players.map(({ userId }) =>
              getModuleInstance(`user-${userId}`, UserModule)
            ),
          );
          const ratings = users.map((u) => u.getState().rating);

          await users[0].actors.matchResult({
            opponentRating: ratings[1],
            result: winner === undefined ? 0.5 : 1 - winner,
            stakes: variant.stakes,
          });

          await users[1].actors.matchResult({
            opponentRating: ratings[0],
            result: winner === undefined ? 0.5 : winner,
            stakes: variant.stakes,
          });
        }

        if (variant.formation !== 'tutorial') {
          await lobby.actors.endMatch({ matchId, status });
        }
      };

      const {
        players,
        playerToMove,
        log,
        moveStartDate,
        status,
      } = match.getState();

      if (status === 'playing') {
        if (log.length < 2) {
          const timeout = setTimeout(async () => {
            matchTimeouts.delete(matchId);
            await match.actors.abort({});
            await endMatch();
          }, moveStartDate + ABORT_TIMEOUT - Date.now());

          matchTimeouts.set(matchId, timeout);
        } else {
          const timeout = setTimeout(async () => {
            matchTimeouts.delete(matchId);
            await match.actors.timeout({ winner: 1 - playerToMove });
            await endMatch();
          }, moveStartDate + players[playerToMove].timeForMoveMs - Date.now());

          matchTimeouts.set(matchId, timeout);
        }
      } else {
        await endMatch();
      }
    };

    if (userId === tutorialUserId) {
      socket.on('match-chat', async (data: any) => {
        data = { ...data, date: Date.now(), userId };

        const match = await getModuleInstance(
          `match-${data.matchId}`,
          MatchModule,
        );

        await match.actors.chat(data);
      });

      socket.on('match-reset-partial', async (data: any) => {
        const match = await getModuleInstance(
          `match-${data.matchId}`,
          MatchModule,
        );

        await match.actors.resetPartial(data);
      });
    }
  });
})();
