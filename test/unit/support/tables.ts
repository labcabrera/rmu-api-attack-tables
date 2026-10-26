import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ConfigService } from '@nestjs/config';
import { TablePaths } from '../../../src/modules/shared/infrastructure/files/table-paths.js';

/** TablePaths over a folder, as RMU_ATTACK_TABLES_DIR sets it; no folder: the bundled tables only. */
export const tablePaths = (dir = '') => new TablePaths({ get: () => dir } as unknown as ConfigService);

/** A new temporary folder for synthetic tables. */
export const tempDir = (prefix: string) => mkdtempSync(path.join(tmpdir(), `rmu-${prefix}-`));

export const writeFile = (file: string, content: string) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
};

export const writeJson = (file: string, data: unknown) => writeFile(file, JSON.stringify(data));

/** Roles of a user with Core Law access, and of one without it. */
export const CORE_LAW = ['rmu-user', 'rmu-core-law'];
export const USER = ['rmu-user'];
