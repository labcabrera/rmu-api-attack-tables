/** A disarm or subdual modifier of an attack table: with the weapon in melee and, when it can be thrown, thrown or shot. */
export interface SpecialManeuverModifier {
  /** Modifier of the attack in melee, or of the only use of a ranged weapon (bows, slings). */
  melee: number;
  /** Modifier when the weapon is thrown (daggers, spears); null when it has no other use. */
  ranged: number | null;
}

/**
 * Disarm and subdual modifiers of an attack table (workspace spec 079, A7; Core Law ch. 10 summary, Tables 9-7a and
 * 9-7e). Null when the maneuver does not apply to the table (balls and bolts). Numbers only.
 */
export interface AttackTableModifiers {
  id: string;
  disarm: SpecialManeuverModifier | null;
  subdual: SpecialManeuverModifier | null;
}
