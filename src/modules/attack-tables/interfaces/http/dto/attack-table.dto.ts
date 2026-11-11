import { ApiProperty } from '@nestjs/swagger';
import type { AttackTableModifiers } from '../../../domain/entities/attack-table-modifiers.js';
import type { AttackResult, AttackTable, AttackTableRow } from '../../../domain/entities/attack-table.js';

/** The result of an attack roll, as rmu-api-tactical reads it. */
export class AttackLookupDto {
  @ApiProperty({ type: String, description: 'Cell of the table', example: '16DP' })
  text: string;

  @ApiProperty({ type: Number, description: 'Concussion hits', example: 16 })
  damage: number;

  @ApiProperty({ type: String, nullable: true, description: 'Critical type (attack table letter)', example: 'P' })
  criticalType: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Critical severity (A-E, F-I on some tables)', example: 'D' })
  criticalSeverity: string | null;

  static fromEntity(result: AttackResult): AttackLookupDto {
    const { text, damage, criticalType, criticalSeverity } = result;
    return Object.assign(new AttackLookupDto(), { text, damage, criticalType, criticalSeverity });
  }
}

export class AttackResultDto extends AttackLookupDto {
  @ApiProperty({ type: Number, description: 'Armor type of the column (1-10)', example: 5 })
  armorType: number;
}

export class AttackTableRowDto {
  @ApiProperty({ type: Number, example: 100 })
  rollMin: number;

  @ApiProperty({ type: Number, example: 102 })
  rollMax: number;

  @ApiProperty({ type: [AttackResultDto], description: 'One cell per armor type, AT 1 to 10' })
  results: AttackResultDto[];
}

export class AttackTableDto {
  @ApiProperty({ type: String, example: 'broadsword' })
  id: string;

  @ApiProperty({ type: [AttackTableRowDto], description: 'Rows from the highest roll band down, as in the book' })
  rows: AttackTableRowDto[];

  static fromEntity(table: AttackTable): AttackTableDto {
    return Object.assign(new AttackTableDto(), {
      id: table.id,
      rows: table.rows.map((row: AttackTableRow) => ({ ...row, results: row.results.map(result => ({ ...result })) })),
    });
  }
}

export class SpecialManeuverModifierDto {
  @ApiProperty({ type: Number, description: 'Modifier in melee, or of the only use of a ranged weapon', example: -75 })
  melee: number;

  @ApiProperty({ type: Number, nullable: true, description: 'Modifier when the weapon is thrown; null when it is not', example: -175 })
  ranged: number | null;
}

/** Disarm and subdual modifiers of an attack table (workspace spec 079, A7; Tables 9-7a and 9-7e). */
export class AttackTableModifiersDto {
  @ApiProperty({ type: String, example: 'dagger' })
  id: string;

  @ApiProperty({ type: SpecialManeuverModifierDto, nullable: true, description: 'Disarm modifier; null when not applicable' })
  disarm: SpecialManeuverModifierDto | null;

  @ApiProperty({ type: SpecialManeuverModifierDto, nullable: true, description: 'Subdual modifier; null when not applicable' })
  subdual: SpecialManeuverModifierDto | null;

  static fromEntity(modifiers: AttackTableModifiers): AttackTableModifiersDto {
    return Object.assign(new AttackTableModifiersDto(), {
      id: modifiers.id,
      disarm: modifiers.disarm ? { ...modifiers.disarm } : null,
      subdual: modifiers.subdual ? { ...modifiers.subdual } : null,
    });
  }
}
