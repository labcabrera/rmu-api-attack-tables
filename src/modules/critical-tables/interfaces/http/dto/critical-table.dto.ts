import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CriticalEntry, CriticalTable } from '../../../domain/entities/critical-table.js';

/** A row of a critical table, as the file has it. */
export class CriticalEntryDto {
  @ApiProperty({ type: Number, example: 67 })
  rollMin: number;

  @ApiProperty({ type: Number, example: 75 })
  rollMax: number;

  @ApiProperty({ type: Number, description: 'Extra hits', example: 17 })
  dmg: number;

  @ApiProperty({ type: String, nullable: true, description: 'Location (head, chest, abdomen, arm, leg)', example: 'leg' })
  location: string | null;

  @ApiProperty({ type: String, example: 'Lower leg wound bleeds freely.' })
  message: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description: 'Effects: `status` plus its fields (value, rounds, delay...)',
    example: [{ status: 'bleeding', value: 2 }],
  })
  effects?: Record<string, unknown>[];

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Injury classification (workspace spec 013)',
  })
  injury?: Record<string, unknown> | null;
}

export class CriticalSeveritiesDto {
  @ApiPropertyOptional({ type: [CriticalEntryDto] })
  A?: CriticalEntryDto[];

  @ApiPropertyOptional({ type: [CriticalEntryDto] })
  B?: CriticalEntryDto[];

  @ApiPropertyOptional({ type: [CriticalEntryDto] })
  C?: CriticalEntryDto[];

  @ApiPropertyOptional({ type: [CriticalEntryDto] })
  D?: CriticalEntryDto[];

  @ApiPropertyOptional({ type: [CriticalEntryDto] })
  E?: CriticalEntryDto[];
}

export class CriticalTableDto {
  @ApiProperty({ type: String, example: 'P' })
  type: string;

  @ApiProperty({ type: CriticalSeveritiesDto, description: 'The rows of each severity, A to E' })
  severities: CriticalSeveritiesDto;

  static fromEntity(table: CriticalTable): CriticalTableDto {
    return Object.assign(new CriticalTableDto(), table);
  }
}

export const toCriticalEntryDto = (entry: CriticalEntry): CriticalEntryDto => Object.assign(new CriticalEntryDto(), entry);
