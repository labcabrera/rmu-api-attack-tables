import { describe, expect, it } from 'vitest';
import { checkTableId, readInt } from '../../../src/modules/shared/domain/services/table-params.js';

describe('table params', () => {
  it('reads integers within bounds', () => {
    expect(readInt('12', 'roll', 1, 100)).toBe(12);
    expect(readInt('-40', 'roll')).toBe(-40);
  });

  it.each(['0', '101', '5a', '1.5', '', 'abc'])('rejects %j as a roll of 1-100', value => {
    expect(() => readInt(value, 'roll', 1, 100)).toThrow(expect.objectContaining({ statusCode: 400, code: 'invalid-roll' }));
  });

  it('names the code after the parameter', () => {
    expect(() => readInt('11', 'armor type', 1, 10)).toThrow(expect.objectContaining({ code: 'invalid-armor-type' }));
    expect(() => readInt('x', 'roll')).toThrow(expect.objectContaining({ message: "Invalid roll 'x' (integer expected)" }));
  });

  it('accepts only plain table ids', () => {
    expect(() => checkTableId('broadsword', 'attack table')).not.toThrow();
    expect(() => checkTableId('../bows', 'fumble table')).toThrow(expect.objectContaining({ code: 'invalid-table-id' }));
    expect(() => checkTableId('Test_Weapon', 'attack table')).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});
