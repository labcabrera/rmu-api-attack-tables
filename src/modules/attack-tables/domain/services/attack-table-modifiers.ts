import type { AttackTableModifiers, SpecialManeuverModifier } from '../entities/attack-table-modifiers.js';

type Pair = [number, number | null];

const pair = ([melee, ranged]: Pair): SpecialManeuverModifier => ({ melee, ranged });

/** Workspace spec 079, A7: [disarm, subdual] per table id, each one [melee, thrown or null]; null when not applicable. */
const MODIFIERS: Record<string, [Pair, Pair] | null> = {
  'arming-sword': [
    [-75, -175],
    [-75, -125],
  ],
  'battle-axe': [
    [-75, -175],
    [-75, -125],
  ],
  beak: [
    [-50, null],
    [-100, null],
  ],
  bite: [
    [-50, null],
    [-100, null],
  ],
  bola: [
    [-150, null],
    [-100, null],
  ],
  'long-bow': [
    [-200, null],
    [-150, null],
  ],
  'short-bow': [
    [-200, null],
    [-150, null],
  ],
  broadsword: [
    [-75, null],
    [-75, null],
  ],
  claw: [
    [-50, null],
    [-75, null],
  ],
  club: [
    [-50, -150],
    [-25, -75],
  ],
  crossbow: [
    [-200, null],
    [-150, null],
  ],
  crush: [
    [-50, null],
    [-25, null],
  ],
  dagger: [
    [-75, -175],
    [-75, -125],
  ],
  falchion: [
    [-75, null],
    [-75, null],
  ],
  'fighting-stick': [
    [-50, null],
    [-50, null],
  ],
  flail: [
    [-50, null],
    [-50, null],
  ],
  grapple: [
    [-50, null],
    [-25, null],
  ],
  horn: [
    [-50, null],
    [-100, null],
  ],
  mace: [
    [-50, null],
    [-50, null],
  ],
  ram: [
    [-50, null],
    [-25, null],
  ],
  rapier: [
    [-100, null],
    [-100, null],
  ],
  rock: [
    [-50, -150],
    [-50, -100],
  ],
  scimitar: [
    [-75, null],
    [-75, null],
  ],
  shield: [
    [-50, null],
    [-50, null],
  ],
  sling: [
    [-150, null],
    [-100, null],
  ],
  spear: [
    [-100, -200],
    [-100, -150],
  ],
  stinger: [
    [-100, -200],
    [-100, -150],
  ],
  trample: [
    [-50, null],
    [-25, null],
  ],
  'unarmed-strikes': [
    [-50, null],
    [-25, null],
  ],
  'unarmed-sweeps': [
    [-50, null],
    [-100, null],
  ],
  'war-hammer': [
    [-50, null],
    [-50, null],
  ],
  whip: [
    [-50, null],
    [-75, null],
  ],
  'cold-ball': null,
  'fire-ball': null,
  'lightning-ball': null,
  'fire-bolt': null,
  'ice-bolt': null,
  'lightning-bolt': null,
  'water-bolt': null,
};

/** Ids of the tables with known modifiers (every bundled table). */
export const ATTACK_TABLE_MODIFIER_IDS = Object.keys(MODIFIERS);

/** The modifiers of a table; for a table without an entry (added later, or from another folder) both are null. */
export const attackTableModifiers = (id: string): AttackTableModifiers => {
  const entry = MODIFIERS[id] ?? null;
  return { id, disarm: entry ? pair(entry[0]) : null, subdual: entry ? pair(entry[1]) : null };
};
