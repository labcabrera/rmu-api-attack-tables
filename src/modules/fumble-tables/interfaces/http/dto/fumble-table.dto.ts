import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FumbleEntry, FumbleTable } from '../../../domain/entities/fumble-table.js';

/** A row of a fumble table, as the file has it. */
export class FumbleEntryDto {
  @ApiProperty({ type: Number, example: 41 })
  rollMin: number;

  @ApiProperty({ type: Number, example: 50 })
  rollMax: number;

  @ApiProperty({ type: String, example: 'You lose your grip.' })
  text: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Effects: `status` plus its fields (value, rounds, delay...)',
    example: [{ status: 'cannot_attack', rounds: 1 }],
  })
  effects?: Record<string, unknown>[];
}

export class FumbleTableDto {
  @ApiProperty({ type: String, example: 'melee-one-hand' })
  id: string;

  @ApiProperty({ type: [FumbleEntryDto] })
  entries: FumbleEntryDto[];

  static fromEntity(table: FumbleTable): FumbleTableDto {
    return Object.assign(new FumbleTableDto(), table);
  }
}

export const toFumbleEntryDto = (entry: FumbleEntry): FumbleEntryDto => Object.assign(new FumbleEntryDto(), entry);
