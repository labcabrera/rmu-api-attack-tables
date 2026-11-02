import { ValidationError } from '../../../shared/domain/errors/errors.js';
import { type Realm, REALMS, SPELL_TYPES, type SpellType } from '../entities/spell-casting-tables.js';

export const readRealm = (realm: string): Realm => {
  if (!REALMS.includes(realm as Realm)) throw new ValidationError(`Invalid realm '${realm}' (${REALMS.join(', ')})`, 'invalid-realm');
  return realm as Realm;
};

export const readSpellType = (type: string): SpellType => {
  if (!SPELL_TYPES.includes(type as SpellType)) {
    throw new ValidationError(`Invalid spell type '${type}' (${SPELL_TYPES.join(', ')})`, 'invalid-spell-type');
  }
  return type as SpellType;
};
