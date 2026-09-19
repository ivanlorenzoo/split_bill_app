import { describe, it } from 'vitest';
import fc from 'fast-check';
import {
  calculateSubtotal,
  calculateTaxAmount,
  calculateTipAmount,
  calculateParticipantShare,
  calculateSummary,
} from '../../calculation.js';

// Feature: split-bill-app, Property 5: Subtotal invariant
describe('Property 5: Subtotal invariant', () => {
  it('calculateSubtotal harus sama persis dengan jumlah semua item.price', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }) })
        ),
        (items) => {
          const subtotal = calculateSubtotal(items);
          const expected = items.reduce((sum, item) => sum + item.price, 0);
          return Math.abs(subtotal - expected) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateSubtotal harus mengembalikan 0 untuk array kosong', () => {
    fc.assert(
      fc.property(
        fc.constant([]),
        (items) => {
          return calculateSubtotal(items) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: split-bill-app, Property 9: Tax and tip calculation correctness
describe('Property 9: Tax and tip calculation correctness', () => {
  it('calculateTipAmount harus sama dengan subtotal * tipRate / 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (subtotal, tipRate) => {
          const tipAmount = calculateTipAmount(subtotal, tipRate);
          const expected = subtotal * tipRate / 100;
          return Math.abs(tipAmount - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateTaxAmount harus sama dengan (subtotal + tipAmount) * taxRate / 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (subtotal, tipRate, taxRate) => {
          const tipAmount = calculateTipAmount(subtotal, tipRate);
          const taxAmount = calculateTaxAmount(subtotal + tipAmount, taxRate);
          const expected = (subtotal + tipAmount) * taxRate / 100;
          return Math.abs(taxAmount - expected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateTaxAmount harus mengembalikan 0 jika subtotalPlusTip = 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (taxRate) => {
          return calculateTaxAmount(0, taxRate) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateTipAmount harus mengembalikan 0 jika subtotal = 0', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (tipRate) => {
          return calculateTipAmount(0, tipRate) === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * arbitraryAppState() — menghasilkan state aplikasi yang valid secara acak:
 *   - 1–5 participant (masing-masing dengan id unik)
 *   - 0–8 item (masing-masing dengan id, nama, harga positif)
 *   - Setiap item memiliki assignedTo berisi minimal 1 participant (tidak ada unassigned item)
 *   - taxRate dan tipRate non-negatif (0–50%)
 *
 * Catatan: property conservation hanya berlaku ketika semua item sudah di-assign.
 * Item yang tidak di-assign (unassigned) tetap masuk ke totalBill namun tidak
 * didistribusikan ke participant manapun — ini adalah perilaku yang disengaja
 * (lihat design.md: "Unassigned Item Warning").
 */
const arbitraryAppState = () =>
    // Langkah 1: tentukan jumlah participant
    fc.integer({ min: 1, max: 5 }).chain((participantCount) =>
      // Langkah 2: buat array participant dengan id unik via uniqueArray
      fc
        .uniqueArray(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          {
            minLength: participantCount,
            maxLength: participantCount,
            selector: (p) => p.id,
          }
        )
        .chain((participants) => {
          const participantIds = participants.map((p) => p.id);

          // Langkah 3: buat item; setiap item harus di-assign ke minimal 1 participant
          // agar conservation property berlaku (tidak ada unassigned item)
          const itemArb = fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
              // subarray dengan minLength: 1 menjamin setiap item punya minimal 1 assignee
              assignedTo: fc.subarray(participantIds, { minLength: 1 }),
            }),
            { minLength: 0, maxLength: 8 }
          );

          return itemArb.chain((items) =>
            fc
              .record({
                taxRate: fc.float({ min: 0, max: Math.fround(50), noNaN: true }),
                tipRate: fc.float({ min: 0, max: Math.fround(50), noNaN: true }),
              })
              .map(({ taxRate, tipRate }) => ({
                participants,
                items,
                taxRate,
                tipRate,
              }))
          );
        })
    );

// Feature: split-bill-app, Property 11: Total bill conservation (sum of shares = total bill)
describe('Property 11: Total bill conservation (sum of shares = total bill)', () => {
  it('jumlah semua participantShare.total harus sama dengan summary.totalBill (toleransi < 0.01)', () => {
    fc.assert(
      fc.property(arbitraryAppState(), (state) => {
        const summary = calculateSummary(state);

        // Tidak ada unassigned item dalam state yang dihasilkan arbitraryAppState,
        // sehingga sum(shares) harus sama dengan totalBill
        const sumOfShares = summary.participantShares.reduce(
          (sum, ps) => sum + ps.total,
          0
        );

        return Math.abs(sumOfShares - summary.totalBill) < 0.01;
      }),
      { numRuns: 200 }
    );
  });

  it('sum of shares harus tepat sama dengan totalBill setelah pembulatan ke 2 desimal', () => {
    fc.assert(
      fc.property(arbitraryAppState(), (state) => {
        const summary = calculateSummary(state);

        // Bulatkan sum ke 2 desimal untuk perbandingan presisi
        const sumOfShares =
          Math.round(
            summary.participantShares.reduce((sum, ps) => sum + ps.total, 0) * 100
          ) / 100;
        const totalBill = Math.round(summary.totalBill * 100) / 100;

        return sumOfShares === totalBill;
      }),
      { numRuns: 200 }
    );
  });

  it('sum of shares harus 0 jika tidak ada participant', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            assignedTo: fc.constant([]),
          }),
          { minLength: 0, maxLength: 8 }
        ),
        fc.float({ min: 0, max: Math.fround(50), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(50), noNaN: true }),
        (items, taxRate, tipRate) => {
          const state = { participants: [], items, taxRate, tipRate };
          const summary = calculateSummary(state);
          return summary.participantShares.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: split-bill-app, Property 12: Total bill formula invariant
describe('Property 12: Total bill formula invariant', () => {
  it('totalBill harus sama dengan subtotal + taxAmount + tipAmount (toleransi pembulatan 2 desimal)', () => {
    fc.assert(
      fc.property(arbitraryAppState(), (state) => {
        const summary = calculateSummary(state);
        // totalBill dibulatkan ke 2 desimal oleh calculateSummary,
        // sehingga toleransi harus mencakup selisih pembulatan (maks 0.005)
        return Math.abs(summary.totalBill - (summary.subtotal + summary.taxAmount + summary.tipAmount)) < 0.005;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: split-bill-app, Property 13: Proportional tax/tip distribution
describe('Property 13: Proportional tax/tip distribution', () => {
  // Arbitrary untuk satu participant dengan item yang di-assign kepadanya
  const arbitraryParticipantWithItems = fc.record({
    participantId: fc.uuid(),
    participantName: fc.string({ minLength: 1, maxLength: 20 }),
    // Item yang di-assign ke participant ini (minimal 1 item agar itemsSubtotal > 0)
    ownItems: fc.array(
      fc.record({
        price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
        assigneeCount: fc.integer({ min: 1, max: 5 }),
      }),
      { minLength: 1, maxLength: 10 }
    ),
    taxRate: fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
    tipRate: fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
    // Subtotal tambahan dari participant lain agar subtotal > itemsSubtotal_i
    otherSubtotal: fc.float({ min: Math.fround(0.01), max: Math.fround(5000), noNaN: true }),
  });

  it('taxShare_i / taxAmount harus proporsional terhadap itemsSubtotal_i / subtotal (toleransi ±0.01)', () => {
    fc.assert(
      fc.property(
        arbitraryParticipantWithItems,
        ({ participantId, participantName, ownItems, taxRate, tipRate, otherSubtotal }) => {
          // Bangun participant
          const participant = { id: participantId, name: participantName };

          // Bangun item yang di-assign ke participant ini
          const items = ownItems.map((oi, idx) => ({
            id: `item-${idx}`,
            name: `Item ${idx}`,
            price: oi.price,
            // participant ini selalu ada di assignedTo; tambah assigneeCount-1 orang lain
            assignedTo: [
              participantId,
              ...Array.from({ length: oi.assigneeCount - 1 }, (_, k) => `other-${idx}-${k}`),
            ],
          }));

          // Hitung itemsSubtotal participant ini (share per item = price / assigneeCount)
          const itemsSubtotal = ownItems.reduce(
            (sum, oi) => sum + oi.price / oi.assigneeCount,
            0
          );

          // subtotal keseluruhan = itemsSubtotal participant ini + kontribusi participant lain
          const subtotal = itemsSubtotal + otherSubtotal;

          const taxAmount = calculateTaxAmount(subtotal, taxRate);
          const tipAmount = calculateTipAmount(subtotal, tipRate);

          // Hitung share participant
          const share = calculateParticipantShare(
            participant,
            items,
            subtotal,
            taxAmount,
            tipAmount
          );

          // Verifikasi proporsi tax: taxShare_i / taxAmount ≈ itemsSubtotal_i / subtotal
          if (taxAmount > 0) {
            const actualRatio = share.taxShare / taxAmount;
            const expectedRatio = share.itemsSubtotal / subtotal;
            if (Math.abs(actualRatio - expectedRatio) >= 0.01) return false;
          }

          // Verifikasi proporsi tip: tipShare_i / tipAmount ≈ itemsSubtotal_i / subtotal
          if (tipAmount > 0) {
            const actualRatio = share.tipShare / tipAmount;
            const expectedRatio = share.itemsSubtotal / subtotal;
            if (Math.abs(actualRatio - expectedRatio) >= 0.01) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('taxShare dan tipShare harus 0 jika subtotal = 0', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
        (participantId, participantName, taxRate, tipRate) => {
          const participant = { id: participantId, name: participantName };
          const subtotal = 0;
          const taxAmount = calculateTaxAmount(subtotal, taxRate); // harus 0
          const tipAmount = calculateTipAmount(subtotal, tipRate); // harus 0

          const share = calculateParticipantShare(participant, [], subtotal, taxAmount, tipAmount);

          return share.taxShare === 0 && share.tipShare === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
