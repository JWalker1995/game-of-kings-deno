import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import { v4 as uuid } from 'uuid';

import { isVariantValid, Variant } from 'game-of-kings-common';

import { userId } from './user';
import { send } from './socket';

const fieldDefns = [
  {
    key: 'radius',
    label: 'Board size',
    default: 4,
    options: { '5': 2, '7': 3, '9': 4, '11': 5, '13': 6 },
  },
  {
    key: 'formation',
    label: 'Formation',
    default: 'colonies',
    options: {
      Colonies: 'colonies',
      Monarchy: 'monarchy',
      Diarchy: 'diarchy',
      Triarchy: 'triarchy',
    },
  },
  {
    key: 'spawnsAvailable',
    label: 'Spawns',
    default: 12,
    options: { '8': 8, '10': 10, '12': 12, '16': 16, '20': 20 },
  },
  {
    key: 'timeInitialMs',
    label: 'Time control initial',
    default: 5 * 60 * 1000,
    options: {
      '1:00': 1 * 60 * 1000,
      '2:00': 2 * 60 * 1000,
      '3:00': 3 * 60 * 1000,
      '5:00': 5 * 60 * 1000,
      '8:00': 8 * 60 * 1000,
      '15:00': 15 * 60 * 1000,
      '30:00': 30 * 60 * 1000,
    },
  },
  {
    key: 'timeIncrementMs',
    label: 'Time control increment',
    default: 8 * 1000,
    options: {
      '0:00': 0 * 1000,
      '0:01': 1 * 1000,
      '0:02': 2 * 1000,
      '0:05': 5 * 1000,
      '0:08': 8 * 1000,
      '0:15': 15 * 1000,
      '0:30': 30 * 1000,
    },
  },
  {
    key: 'stakes',
    label: 'Stakes',
    default: 1,
    options: { Casual: 0, '1x': 1, '2x': 2, '4x': 4 },
  },
];

export default ({ onClose }: { onClose: () => void }) => {
  const fields = fieldDefns.map((f) => {
    const [value, setter] = React.useState(f.default);
    return { ...f, value, setter };
  });

  return (
    <Form
      onSubmit={() => {
        send('lobby-extend-challenge', {
          id: uuid(),
          challengerId: userId,
          variant: Object.fromEntries(fields.map((f) => [f.key, f.value])),
        });

        onClose();
      }}
    >
      {fields.map((f, index) => (
        <Form.Field key={f.key}>
          <label>{f.label}</label>
          <Button.Group widths={Object.entries(f.options).length as any}>
            {Object.entries(f.options).map(([k, v]) => (
              <Button
                key={k}
                type='button'
                toggle
                active={f.value === v}
                disabled={!isVariantValid(Object.fromEntries(
                  fields.map((g) =>
                    g.key === f.key ? [g.key, v] : [g.key, g.value]
                  ),
                ) as Variant)}
                onClick={() => f.setter(v)}
              >
                {k}
              </Button>
            ))}
          </Button.Group>
        </Form.Field>
      ))}

      <Button fluid primary type='submit'>
        Create
      </Button>
    </Form>
  );
};
