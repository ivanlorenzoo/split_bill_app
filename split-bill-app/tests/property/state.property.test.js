// property-based tests untuk state.js
import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import AppState from '../../state.js';
import { calculateSubtotal } from '../../calculation.js';

// ---------------------------------------------------------------------------
// Helper: reset state sebelum setiap test
// ---------------------------------------------------------------------------

beforeEach(() => {
  AppState.reset();
});

// ---------------------------------------------------------------------------
// Arbitrary helpers
// ---------------------------------------------------------------------------

/**
 * Arbitrary untuk nama participant yang valid (non-empty, non-whitespace).
 */
const validName = fc.string({ minLength: 1, maxLength: 20 }).filter(
  (s) => s.trim().length > 0
);

/**
 * Arbitrary untuk harga item yang valid (angka positif).
 */
const validPrice = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true });

/**
 * Arbitrary untuk state aplikasi yang valid:
 * - 1–5 participant dengan nama unik
 * - 0–5 item dengan harga positif
 * - Setiap item di-assign ke subset acak dari participant
 * - taxRate dan tipRate non-negatif
 *
 * Mengembalikan { participantNames, itemDefs, taxRate, tipRate }
 * sehingga test dapat membangun state via AppState mutations.
 */
const arbitraryStateSetup = () =>
  fc.integer({ min: 1, max: 5 }).chain((participantCount) =>
    fc
      .uniqueArray(validName, {
        minLength: participantCount,
        maxLength: participantCount,
      })
      .chain((participantNames) =>
        fc
          .array(
            fc.record({
              name: validName,
              price: validPrice,
            }),
            { minLength: 0, maxLength: 5 }
          )
          .chain((itemDefs) =>
            fc
              .record({
                taxRate: fc.float({ min: 0, max: Math.fround(50), noNaN: true }),
                tipRate: fc.float({ min: 0, max: Math.fround(50), noNaN: true }),
              })
              .map(({ taxRate, tipRate }) => ({
                participantNames,
                itemDefs,
                taxRate,
                tipRate,
              }))
          )
      )
  );

/**
 * Membangun state AppState dari setup dan mengembalikan participant + item yang dibuat.
 * @param {{ participantNames: string[], itemDefs: {name: string, price: number}[], taxRate: number, tipRate: number }} setup
 * @returns {{ participants: Participant[], items: BillItem[] }}
 */
function buildState(setup) {
  AppState.reset();

  for (const name of setup.participantNames) {
    AppState.addParticipant(name);
  }

  for (const def of setup.itemDefs) {
    AppState.addItem(def.name, def.price);
  }

  AppState.setTaxRate(setup.taxRate);
  AppState.setTipRate(setup.tipRate);

  return {
    participants: [...AppState.participants],
    items: [...AppState.items],
  };
}

// ---------------------------------------------------------------------------
// Feature: split-bill-app, Property 3: Participant removal cleans all assignments
// ---------------------------------------------------------------------------

describe('Property 3: Participant removal cleans all assignments', () => {
  it('setelah removeParticipant(id), id tidak ada di participants maupun item.assignedTo manapun', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup(),
        (setup) => {
          const { participants, items } = buildState(setup);

          if (participants.length === 0) return true;

          // Assign semua participant ke semua item agar ada assignment yang perlu dibersihkan
          for (const item of AppState.items) {
            AppState.assignAll(item.id);
          }

          // Pilih participant pertama untuk dihapus
          const targetId = participants[0].id;

          AppState.removeParticipant(targetId);

          // Verifikasi: id tidak ada di participants
          const stillInParticipants = AppState.participants.some(
            (p) => p.id === targetId
          );
          if (stillInParticipants) return false;

          // Verifikasi: id tidak ada di assignedTo item manapun
          const stillInAssignments = AppState.items.some(
            (item) => item.assignedTo.includes(targetId)
          );
          if (stillInAssignments) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('menghapus participant yang tidak ada tidak mengubah state', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup(),
        fc.uuid(),
        (setup, nonExistentId) => {
          buildState(setup);

          const participantsBefore = AppState.participants.length;
          const itemsBefore = AppState.items.length;

          AppState.removeParticipant(nonExistentId);

          return (
            AppState.participants.length === participantsBefore &&
            AppState.items.length === itemsBefore
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: split-bill-app, Property 6: Item deletion updates summary
// ---------------------------------------------------------------------------

describe('Property 6: Item deletion updates summary', () => {
  it('setelah removeItem(X.id), calculateSubtotal harus berkurang sebesar X.price', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup().filter((s) => s.itemDefs.length > 0),
        (setup) => {
          buildState(setup);

          if (AppState.items.length === 0) return true;

          // Pilih item pertama untuk dihapus
          const targetItem = AppState.items[0];
          const subtotalBefore = calculateSubtotal(AppState.items);

          AppState.removeItem(targetItem.id);

          const subtotalAfter = calculateSubtotal(AppState.items);
          const expectedSubtotal = subtotalBefore - targetItem.price;

          return Math.abs(subtotalAfter - expectedSubtotal) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('setelah removeItem, item tidak ada lagi di state', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup().filter((s) => s.itemDefs.length > 0),
        (setup) => {
          buildState(setup);

          if (AppState.items.length === 0) return true;

          const targetId = AppState.items[0].id;
          AppState.removeItem(targetId);

          return !AppState.items.some((item) => item.id === targetId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: split-bill-app, Property 8: Assign-all completeness
// ---------------------------------------------------------------------------

describe('Property 8: Assign-all completeness', () => {
  it('setelah assignAll(itemId), item.assignedTo mengandung semua participant.id', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup().filter(
          (s) => s.participantNames.length > 0 && s.itemDefs.length > 0
        ),
        (setup) => {
          buildState(setup);

          if (AppState.participants.length === 0 || AppState.items.length === 0) {
            return true;
          }

          const targetItem = AppState.items[0];
          AppState.assignAll(targetItem.id);

          const allParticipantIds = AppState.participants.map((p) => p.id);
          const updatedItem = AppState.items.find((item) => item.id === targetItem.id);

          // Setiap participant harus ada di assignedTo
          return allParticipantIds.every((pid) =>
            updatedItem.assignedTo.includes(pid)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('assignAll tidak menduplikasi participant yang sudah di-assign', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup().filter(
          (s) => s.participantNames.length > 0 && s.itemDefs.length > 0
        ),
        (setup) => {
          buildState(setup);

          if (AppState.participants.length === 0 || AppState.items.length === 0) {
            return true;
          }

          const targetItem = AppState.items[0];

          // Assign dua kali
          AppState.assignAll(targetItem.id);
          AppState.assignAll(targetItem.id);

          const updatedItem = AppState.items.find((item) => item.id === targetItem.id);
          const uniqueIds = new Set(updatedItem.assignedTo);

          // Tidak boleh ada duplikat
          return uniqueIds.size === updatedItem.assignedTo.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: split-bill-app, Property 14: Reset returns to initial state
// ---------------------------------------------------------------------------

describe('Property 14: Reset returns to initial state', () => {
  it('setelah reset(), semua field kembali ke nilai awal', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup(),
        (setup) => {
          buildState(setup);

          // Assign beberapa item agar state benar-benar terisi
          for (const item of AppState.items) {
            AppState.assignAll(item.id);
          }

          AppState.reset();

          return (
            AppState.participants.length === 0 &&
            AppState.items.length === 0 &&
            AppState.taxRate === 0 &&
            AppState.tipRate === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('reset() memanggil listener (observer dipanggil)', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup(),
        (setup) => {
          buildState(setup);

          let notified = false;
          const unsubscribe = AppState.subscribe(() => {
            notified = true;
          });

          AppState.reset();
          unsubscribe();

          return notified === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('setelah reset(), state dapat digunakan kembali untuk sesi baru', () => {
    fc.assert(
      fc.property(
        arbitraryStateSetup(),
        validName,
        validPrice,
        (setup, newName, newPrice) => {
          buildState(setup);
          AppState.reset();

          // Setelah reset, harus bisa menambah participant dan item baru
          const addResult = AppState.addParticipant(newName);
          if (!addResult.success) return false;

          const itemResult = AppState.addItem('Item Baru', newPrice);
          if (!itemResult.success) return false;

          return (
            AppState.participants.length === 1 &&
            AppState.items.length === 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
