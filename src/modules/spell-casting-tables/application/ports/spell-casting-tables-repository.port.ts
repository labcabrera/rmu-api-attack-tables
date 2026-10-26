import type { Realm, SpellcastingModifiers, SpellFailureTable } from '../../domain/entities/spell-casting-tables.js';

export const SPELL_CASTING_TABLES_REPOSITORY = Symbol('SpellCastingTablesRepository');

/** Spell Law casting tables (workspace spec 030). The data lives outside this repository: null without it. */
export interface SpellCastingTablesRepository {
  findModifiers(): Promise<SpellcastingModifiers | null>;
  findFailureTable(realm: Realm): Promise<SpellFailureTable | null>;
}
