import { ValidationError } from '../errors/errors.js';

/** Table ids are file names: lowercase letters, digits and `-`, so they never leave the tables folder. */
export const TABLE_ID = /^[a-z0-9-]+$/;

export const checkTableId = (id: string, label: string, pattern: RegExp = TABLE_ID): void => {
  if (!pattern.test(id)) throw new ValidationError(`Invalid ${label} identifier '${id}'`, 'invalid-table-id');
};

/** An integer path parameter within bounds: `readInt('12', 'roll', 1, 100)`. */
export const readInt = (value: string, label: string, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number => {
  const number = /^-?\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    const range = min === Number.MIN_SAFE_INTEGER ? 'integer expected' : `${min}-${max}`;
    throw new ValidationError(`Invalid ${label} '${value}' (${range})`, `invalid-${label.replace(/ /g, '-')}`);
  }
  return number;
};

/** An optional boolean query parameter: `true`, `false` or missing (`fallback`). */
export const readBoolean = (value: string | undefined, label: string, fallback = false): boolean => {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ValidationError(`Invalid ${label} '${value}' (true or false)`, `invalid-${label.replace(/ /g, '-')}`);
};
