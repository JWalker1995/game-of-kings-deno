import React from 'react';
import { Button, Grid, Header, Message, Modal, Table } from 'semantic-ui-react';

import { send } from './socket.ts';
import BoardSnapshotRenderer from '~/client/BoardSnapshotRenderer.tsx';

export default () => {
  const [username, setUsername] = React.useState('');

  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <Modal
      trigger={
        <div style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
          Rules
        </div>
      }
      open={open}
      onClose={() => setOpen(false)}
    >
      <Modal.Header>Game of Kings</Modal.Header>
      <Modal.Content>
        <Grid stackable divided='vertically'>
          <Grid.Row columns={2}>
            <Grid.Column width={16} style={{ fontSize: 16 }}>
              There are two types of pieces; kings and pawns:<br />
              Both can move one cell in any direction, with all captures
              permitted, with one exception: pawns cannot capture pawns.
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={4}
                viewBox='-3 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '0,0,0': { playerIndex: 0, type: 'king' },
                  '0,1,-1': { playerIndex: 1, type: 'king' },
                  '-1,1,0': { playerIndex: 1, type: 'pawn' },
                }}
              />
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={4}
                viewBox='-3 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '0,0,0': { playerIndex: 0, type: 'pawn' },
                  '0,1,-1': { playerIndex: 1, type: 'king' },
                  '-1,1,0': { playerIndex: 1, type: 'pawn' },
                }}
                infos={[{
                  at: '-1,1,0',
                  text: `Notice that this piece cannot be captured`,
                }]}
              />
            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column width={16} style={{ fontSize: 16 }}>
              Three of your pieces angled 120° can "launch" the center piece.
              This glider can capture anything.<br />
              Note the space behind the glider must be empty.
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={8}
                viewBox='-3 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '-5,-1,6': { playerIndex: 0, type: 'pawn' },
                  '-5,0,5': { playerIndex: 0, type: 'pawn' },
                  '-6,1,5': { playerIndex: 0, type: 'pawn' },
                  '5,0,-5': { playerIndex: 1, type: 'pawn' },
                }}
                selectedCell='-5,0,5'
              />
            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column width={16} style={{ fontSize: 16 }}>
              To summarize:
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <Table definition celled fixed>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell />
                    <Table.HeaderCell>A pawn</Table.HeaderCell>
                    <Table.HeaderCell>A king</Table.HeaderCell>
                    <Table.HeaderCell>A gliding pawn</Table.HeaderCell>
                    <Table.HeaderCell>A gliding king</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  <Table.Row>
                    <Table.Cell>... can capture a pawn</Table.Cell>
                    <Table.Cell negative>No</Table.Cell>
                    <Table.Cell positive>Yes (and +1 spawn)</Table.Cell>
                    <Table.Cell positive>Yes</Table.Cell>
                    <Table.Cell positive>Yes (and +1 spawn)</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>... can capture a king</Table.Cell>
                    <Table.Cell positive>Yes</Table.Cell>
                    <Table.Cell positive>Yes (and +1 spawn)</Table.Cell>
                    <Table.Cell positive>Yes</Table.Cell>
                    <Table.Cell positive>Yes (and +1 spawn)</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={2}>
            <Grid.Column width={16} style={{ fontSize: 16 }}>
              The game starts with only kings. Pawns may be placed (spawned)
              next to your king into empty spaces.<br />
              Each player is allowed 12 spawns. Additionally, when your king
              captures a piece, you gain an extra spawn.
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={3}
                viewBox='1 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '1,0,-1': { playerIndex: 0, type: 'king' },
                }}
                selectedCell='1,0,-1'
                showSpawns
              />
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={4}
                viewBox='-3 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '0,0,0': { playerIndex: 0, type: 'king' },
                  '-1,1,0': { playerIndex: 1, type: 'pawn' },
                }}
                infos={[{
                  at: '-1,1,0',
                  text:
                    `If this piece is captured, the king gains an extra spawn`,
                }]}
              />
            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={2}>
            <Grid.Column width={16} style={{ fontSize: 16 }}>
              When your king is attacked, it's called check. You can't move into
              check, and when in check you must move out.<br />
              A checkmate occurs if you have no legal moves to escape. This ends
              the game immediately, and the player who delivered checkmate wins.
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={4}
                viewBox='-3 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '-1,-1,2': { playerIndex: 1, type: 'pawn' },
                  '-1,0,1': { playerIndex: 1, type: 'pawn' },
                  '-2,1,1': { playerIndex: 1, type: 'king' },
                  '0,1,-1': { playerIndex: 1, type: 'pawn' },
                  '2,0,-2': { playerIndex: 0, type: 'king' },
                }}
                selectedCell='2,0,-2'
                onlyLegalMoves
              />
            </Grid.Column>
            <Grid.Column style={{ marginTop: 0 }}>
              <BoardSnapshotRenderer
                radius={4}
                viewBox='-3 -3 6 6'
                style={{ height: 200, width: '100%' }}
                formation={{
                  '-1,0,1': { playerIndex: 1, type: 'pawn' },
                  '-2,1,1': { playerIndex: 1, type: 'pawn' },
                  '2,-1,-1': { playerIndex: 1, type: 'king' },
                  '0,0,0': { playerIndex: 0, type: 'king' },
                  '0,1,-1': { playerIndex: 0, type: 'pawn' },
                }}
                selectedCell='0,0,0'
                onlyLegalMoves
                infos={[{
                  at: '0,0,0',
                  heightOffset: 0.75,
                  text:
                    `This is checkmate, because the blue king has no legal moves`,
                }]}
              />
            </Grid.Column>
          </Grid.Row>

          <Grid.Row columns={1}>
            <Grid.Column>
              <Button
                fluid
                primary
                type='submit'
                onClick={() => setOpen(false)}
              >
                Got it
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Modal.Content>
    </Modal>
  );
};
