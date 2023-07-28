import React from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';

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
      <Modal.Header>Rules</Modal.Header>
      <Modal.Content image>
        <Form>
          <BoardSnapshotRenderer
            size={4}
            formation={{ '0,0,0': { playerIndex: 0, type: 'king' } }}
          />

          <Button type='submit' onClick={() => setOpen(false)}>
            Got it
          </Button>
        </Form>
      </Modal.Content>
    </Modal>
  );
};
