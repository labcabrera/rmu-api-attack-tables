import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GetAttackTableModifiersHandler } from '../../../src/modules/attack-tables/application/cqrs/handlers/get-attack-table-modifiers.handler.js';
import { GetAttackTableModifiersQuery } from '../../../src/modules/attack-tables/application/cqrs/queries/get-attack-table-modifiers.query.js';
import {
  ATTACK_TABLE_MODIFIER_IDS,
  attackTableModifiers,
} from '../../../src/modules/attack-tables/domain/services/attack-table-modifiers.js';
import { FileAttackTableRepository } from '../../../src/modules/attack-tables/infrastructure/files/file.attack-table.repository.js';
import { BUNDLED_DIR } from '../../../src/modules/shared/infrastructure/files/table-paths.js';
import { tablePaths, tempDir, writeFile } from '../support/tables.js';

// Workspace spec 079, A7: disarm and subdual modifiers per attack table.
describe('attack table modifiers', () => {
  const dir = tempDir('attack-table-modifiers');
  writeFile(path.join(dir, 'attack-tables', 'test-weapon.csv'), 'roll,at1\n1-175,5');
  const handler = new GetAttackTableModifiersHandler(new FileAttackTableRepository(tablePaths(dir)));
  const get = (id: string) => handler.execute(new GetAttackTableModifiersQuery(id));

  it('has an entry for every bundled table', () => {
    const bundled = readdirSync(path.join(BUNDLED_DIR, 'attack')).map(file => file.replace(/\.csv$/, ''));
    expect([...ATTACK_TABLE_MODIFIER_IDS].sort()).toEqual(bundled.sort());
  });

  it('gives the melee and thrown modifiers of a weapon', async () => {
    await expect(get('dagger')).resolves.toEqual({
      id: 'dagger',
      disarm: { melee: -75, ranged: -175 },
      subdual: { melee: -75, ranged: -125 },
    });
    expect(attackTableModifiers('broadsword')).toMatchObject({ disarm: { melee: -75, ranged: null } });
    expect(attackTableModifiers('long-bow')).toMatchObject({ disarm: { melee: -200 }, subdual: { melee: -150 } });
  });

  it('gives null when the maneuver does not apply', () => {
    expect(attackTableModifiers('fire-ball')).toEqual({ id: 'fire-ball', disarm: null, subdual: null });
  });

  it('gives null for a table without known modifiers', async () => {
    await expect(get('test-weapon')).resolves.toEqual({ id: 'test-weapon', disarm: null, subdual: null });
  });

  it('rejects an invalid or unknown table', async () => {
    await expect(get('../x')).rejects.toMatchObject({ code: 'invalid-table-id' });
    await expect(get('missing')).rejects.toMatchObject({ code: 'not-found' });
  });
});
