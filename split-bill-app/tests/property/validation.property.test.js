// Feature: split-bill-app — Property-based tests untuk validation.js
// Property 1: Participant name validation rejects whitespace-only input
// Property 2: Duplicate participant rejection
// Property 4: Item price validation rejects non-positive values
// Property 10: Tax and tip rate validation rejects negative values

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { validateParticipantName, validateItemPrice, validateRate } from '../../validation.js';

describe('validation.property — Property 1: Participant name validation rejects whitespace-only input', () => {
  // Feature: split-bill-app, Property 1: Participant name validation rejects whitespace-only input
  // Validates: Requirements 1.3
  it('mengembalikan { valid: false } untuk semua string yang hanya berisi karakter whitespace', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespaceStr) => {
          const result = validateParticipantName(whitespaceStr, []);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('validation.property — Property 2: Duplicate participant rejection', () => {
  // Feature: split-bill-app, Property 2: Duplicate participant rejection
  // Validates: Requirements 1.4
  it('mengembalikan { valid: false } ketika nama yang ditambahkan sudah ada dalam daftar (case-insensitive)', () => {
    fc.assert(
      fc.property(
        // Generate array of unique non-empty names
        fc.array(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          { minLength: 1, maxLength: 19 }
        ).filter((names) => {
          // Ensure all names are unique (case-insensitive, trimmed)
          const normalized = names.map((n) => n.trim().toLowerCase());
          return new Set(normalized).size === normalized.length;
        }),
        (uniqueNames) => {
          // Pick one of the existing names as the duplicate candidate
          const duplicateIndex = Math.floor(uniqueNames.length / 2);
          const duplicate = uniqueNames[duplicateIndex];

          const result = validateParticipantName(duplicate, uniqueNames);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mengembalikan { valid: false } untuk duplikat yang berbeda kapitalisasi', () => {
    fc.assert(
      fc.property(
        // Generate a single non-empty name
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (name) => {
          const trimmed = name.trim();
          const upperName = trimmed.toUpperCase();
          const lowerName = trimmed.toLowerCase();

          // Both upper and lower case variants should be rejected when the other exists
          const resultUpper = validateParticipantName(upperName, [lowerName]);
          const resultLower = validateParticipantName(lowerName, [upperName]);

          return resultUpper.valid === false && resultLower.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mengembalikan { valid: true } untuk nama baru yang belum ada dalam daftar', () => {
    fc.assert(
      fc.property(
        // Generate array of unique non-empty names
        fc.array(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          { minLength: 0, maxLength: 19 }
        ).filter((names) => {
          const normalized = names.map((n) => n.trim().toLowerCase());
          return new Set(normalized).size === normalized.length;
        }),
        // Generate a new name that is guaranteed not to be in the list
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (existingNames, newName) => {
          const normalizedNew = newName.trim().toLowerCase();
          const normalizedExisting = existingNames.map((n) => n.trim().toLowerCase());

          // Skip if the new name happens to collide with an existing one
          if (normalizedExisting.includes(normalizedNew)) {
            return true; // discard this sample
          }

          const result = validateParticipantName(newName, existingNames);
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('validation.property — Property 4: Item price validation rejects non-positive values', () => {
  // Feature: split-bill-app, Property 4: Item price validation rejects non-positive values
  // Validates: Requirements 2.3
  it('mengembalikan { valid: false } untuk nilai 0, negatif, NaN, undefined, dan string non-numerik', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.double({ max: -0.001, noNaN: true }),
          fc.constant(NaN),
          fc.constant(undefined),
          fc.string()
        ),
        (invalidPrice) => {
          const result = validateItemPrice(invalidPrice);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mengembalikan { valid: true } untuk semua angka positif', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 1_000_000, noNaN: true }),
        (positivePrice) => {
          const result = validateItemPrice(positivePrice);
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('validation.property — Property 10: Tax and tip rate validation rejects negative values', () => {
  // Feature: split-bill-app, Property 10: Tax and tip rate validation rejects negative values
  // Validates: Requirements 4.4
  it('mengembalikan { valid: false } untuk semua angka negatif', () => {
    fc.assert(
      fc.property(
        fc.float({ max: Math.fround(-0.001) }),
        (negativeRate) => {
          const result = validateRate(negativeRate);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mengembalikan { valid: false } untuk NaN', () => {
    fc.assert(
      fc.property(
        fc.constant(NaN),
        (nanRate) => {
          const result = validateRate(nanRate);
          return result.valid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mengembalikan { valid: true } untuk 0 dan semua angka positif', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000, noNaN: true }),
        (nonNegativeRate) => {
          const result = validateRate(nonNegativeRate);
          return result.valid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
