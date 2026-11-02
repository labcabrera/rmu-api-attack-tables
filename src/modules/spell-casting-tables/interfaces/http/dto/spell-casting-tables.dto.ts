import { ApiProperty } from '@nestjs/swagger';
import { REALMS, type SpellFailureRow, type SpellFailureTable } from '../../../domain/entities/spell-casting-tables.js';

export class SpellFailureRowDto {
  @ApiProperty({ type: Number, example: 11 })
  rollMin: number;

  @ApiProperty({ type: Number, nullable: true, description: 'Null: open-ended', example: 30 })
  rollMax: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object', additionalProperties: true },
    description: 'Result per spell type (elemental, force, informational, utility): text, pp...',
  })
  results: SpellFailureRow['results'];
}

export class SpellFailureTableDto {
  @ApiProperty({ type: String, enum: REALMS, example: 'essence' })
  realm: string;

  @ApiProperty({ type: [SpellFailureRowDto] })
  rows: SpellFailureRowDto[];

  static fromEntity(table: SpellFailureTable): SpellFailureTableDto {
    return Object.assign(new SpellFailureTableDto(), table);
  }
}
