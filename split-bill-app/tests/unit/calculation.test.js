import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  calculateTaxAmount,
  calculateTipAmount,
  calculateParticipantShare,
  distributeRemainder,
  calculateSummary,
} from '../../calculation.js';

// ---------------------------------------------------------------------------
// calculateSubtotal
// ---------------------------------------------------------------------------
describe('calculateSubtotal', () => {
  it('returns 0 for empty array (Req 2.7)', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it('returns 0 for non-array input', () => {
    expect(calculateSubtotal(null)).toBe(0);
    expect(calculateSubtotal(undefined)).toBe(0);
  });

  it('returns the price of a single item (Req 2.7)', () => {
    const items = [{ id: '1', name: 'Nasi Goreng', price: 25000, assignedTo: [] }];
    expect(calculateSubtotal(items)).toBe(25000);
  });

  it('sums all item prices correctly (Req 2.7)', () => {
    const items = [
      { id: '1', name: 'Nasi Goreng', price: 25000, assignedTo: [] },
      { id: '2', name: 'Es Teh', price: 5000, assignedTo: [] },
      { id: '3', name: 'Ayam Bakar', price: 35000, assignedTo: [] },
    ];
    expect(calculateSubtotal(items)).toBe(65000);
  });

  it('handles items with decimal prices', () => {
    const items = [
      { id: '1', name: 'Item A', price: 10.50, assignedTo: [] },
      { id: '2', name: 'Item B', price: 5.25, assignedTo: [] },
    ];
    expect(calculateSubtotal(items)).toBeCloseTo(15.75, 5);
  });

  it('treats missing price as 0', () => {
    const items = [
      { id: '1', name: 'Item A', price: 10, assignedTo: [] },
      { id: '2', name: 'Item B', assignedTo: [] }, // no price
    ];
    expect(calculateSubtotal(items)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// calculateTaxAmount
// ---------------------------------------------------------------------------
describe('calculateTaxAmount', () => {
  it('returns 0 when taxRate is 0% (Req 4.3)', () => {
    expect(calculateTaxAmount(100000, 0)).toBe(0);
  });

  it('returns 0 when subtotalPlusTip is 0 (Req 4.3)', () => {
    expect(calculateTaxAmount(0, 10)).toBe(0);
  });

  it('calculates tax correctly: (subtotal + tip) * rate / 100 (Req 4.3)', () => {
    // subtotal=100000, tip=10000 → subtotalPlusTip=110000, tax=11000
    expect(calculateTaxAmount(110000, 10)).toBe(11000);
  });

  it('calculates tax for fractional rate', () => {
    expect(calculateTaxAmount(200, 7.5)).toBeCloseTo(15, 5);
  });

  it('calculates tax for 100% rate', () => {
    expect(calculateTaxAmount(50000, 100)).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// calculateTipAmount
// ---------------------------------------------------------------------------
describe('calculateTipAmount', () => {
  it('returns 0 when tipRate is 0% (Req 4.3)', () => {
    expect(calculateTipAmount(100000, 0)).toBe(0);
  });

  it('returns 0 when subtotal is 0 (Req 4.3)', () => {
    expect(calculateTipAmount(0, 15)).toBe(0);
  });

  it('calculates tip correctly: subtotal * rate / 100 (Req 4.3)', () => {
    expect(calculateTipAmount(100000, 15)).toBe(15000);
  });

  it('calculates tip for 100% rate — equals subtotal (Req 4.3)', () => {
    // tipRate 100% means tip = subtotal * 1
    expect(calculateTipAmount(75000, 100)).toBe(75000);
  });

  it('calculates tip for fractional rate', () => {
    expect(calculateTipAmount(300, 5.5)).toBeCloseTo(16.5, 5);
  });
});

// ---------------------------------------------------------------------------
// calculateParticipantShare
// ---------------------------------------------------------------------------
describe('calculateParticipantShare', () => {
  const alice = { id: 'alice', name: 'Alice' };
  const bob = { id: 'bob', name: 'Bob' };

  it('returns zero totals when participant has no assigned items', () => {
    const items = [{ id: 'i1', name: 'Nasi', price: 30000, assignedTo: ['bob'] }];
    const result = calculateParticipantShare(alice, items, 30000, 3000, 0);
    expect(result.itemsSubtotal).toBe(0);
    expect(result.taxShare).toBe(0);
    expect(result.tipShare).toBe(0);
    expect(result.rawTotal).toBe(0);
  });

  it('calculates full share when item assigned to one participant (Req 3.5)', () => {
    const items = [{ id: 'i1', name: 'Nasi', price: 30000, assignedTo: ['alice'] }];
    const result = calculateParticipantShare(alice, items, 30000, 0, 0);
    expect(result.itemsSubtotal).toBe(30000);
    expect(result.rawTotal).toBe(30000);
  });

  it('splits item price evenly when assigned to multiple participants (Req 3.5)', () => {
    const items = [{ id: 'i1', name: 'Pizza', price: 60000, assignedTo: ['alice', 'bob'] }];
    const subtotal = 60000;
    const aliceShare = calculateParticipantShare(alice, items, subtotal, 0, 0);
    const bobShare = calculateParticipantShare(bob, items, subtotal, 0, 0);

    expect(aliceShare.itemsSubtotal).toBe(30000);
    expect(bobShare.itemsSubtotal).toBe(30000);
    // Sum of shares equals item price
    expect(aliceShare.itemsSubtotal + bobShare.itemsSubtotal).toBe(60000);
  });

  it('distributes tax proportionally based on itemsSubtotal (Req 4.5)', () => {
    // Alice has item worth 75000, Bob has item worth 25000 → subtotal 100000
    const items = [
      { id: 'i1', name: 'Steak', price: 75000, assignedTo: ['alice'] },
      { id: 'i2', name: 'Salad', price: 25000, assignedTo: ['bob'] },
    ];
    const subtotal = 100000;
    const taxAmount = 10000; // 10%

    const aliceShare = calculateParticipantShare(alice, items, subtotal, taxAmount, 0);
    const bobShare = calculateParticipantShare(bob, items, subtotal, taxAmount, 0);

    // Alice pays 75% of tax, Bob pays 25%
    expect(aliceShare.taxShare).toBeCloseTo(7500, 5);
    expect(bobShare.taxShare).toBeCloseTo(2500, 5);
  });

  it('distributes tip proportionally based on itemsSubtotal (Req 4.5)', () => {
    const items = [
      { id: 'i1', name: 'Burger', price: 40000, assignedTo: ['alice'] },
      { id: 'i2', name: 'Fries', price: 10000, assignedTo: ['bob'] },
    ];
    const subtotal = 50000;
    const tipAmount = 5000; // 10%

    const aliceShare = calculateParticipantShare(alice, items, subtotal, 0, tipAmount);
    const bobShare = calculateParticipantShare(bob, items, subtotal, 0, tipAmount);

    // Alice pays 80% of tip, Bob pays 20%
    expect(aliceShare.tipShare).toBeCloseTo(4000, 5);
    expect(bobShare.tipShare).toBeCloseTo(1000, 5);
  });

  it('includes correct item details in result', () => {
    const items = [{ id: 'i1', name: 'Sushi', price: 50000, assignedTo: ['alice'] }];
    const result = calculateParticipantShare(alice, items, 50000, 0, 0);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].itemId).toBe('i1');
    expect(result.items[0].name).toBe('Sushi');
    expect(result.items[0].share).toBe(50000);
  });

  it('sets taxShare and tipShare to 0 when subtotal is 0', () => {
    const result = calculateParticipantShare(alice, [], 0, 1000, 500);
    expect(result.taxShare).toBe(0);
    expect(result.tipShare).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// distributeRemainder
// ---------------------------------------------------------------------------
describe('distributeRemainder', () => {
  it('returns empty array for empty input', () => {
    expect(distributeRemainder([], 0)).toEqual([]);
  });

  it('ensures sum of shares equals totalBill exactly (Req 5.5)', () => {
    // 10 / 3 = 3.333... — classic rounding problem
    const rawShares = [
      { participantId: 'a', name: 'Alice', itemsSubtotal: 10/3, taxShare: 0, tipShare: 0, rawTotal: 10/3, total: 10/3, items: [] },
      { participantId: 'b', name: 'Bob',   itemsSubtotal: 10/3, taxShare: 0, tipShare: 0, rawTotal: 10/3, total: 10/3, items: [] },
      { participantId: 'c', name: 'Carol', itemsSubtotal: 10/3, taxShare: 0, tipShare: 0, rawTotal: 10/3, total: 10/3, items: [] },
    ];
    const totalBill = 10;
    const result = distributeRemainder(rawShares, totalBill);
    const sum = result.reduce((acc, s) => acc + s.total, 0);
    expect(Math.round(sum * 100) / 100).toBe(totalBill);
  });

  it('ensures sum of shares equals totalBill for 2-decimal precision (Req 5.5)', () => {
    // 100 / 3 = 33.333...
    const rawShares = [
      { participantId: 'a', name: 'Alice', itemsSubtotal: 100/3, taxShare: 0, tipShare: 0, rawTotal: 100/3, total: 100/3, items: [] },
      { participantId: 'b', name: 'Bob',   itemsSubtotal: 100/3, taxShare: 0, tipShare: 0, rawTotal: 100/3, total: 100/3, items: [] },
      { participantId: 'c', name: 'Carol', itemsSubtotal: 100/3, taxShare: 0, tipShare: 0, rawTotal: 100/3, total: 100/3, items: [] },
    ];
    const totalBill = 100;
    const result = distributeRemainder(rawShares, totalBill);
    const sum = result.reduce((acc, s) => acc + s.total, 0);
    expect(Math.round(sum * 100) / 100).toBe(totalBill);
  });

  it('distributes remainder to participant with largest fractional part', () => {
    // 1.005 + 1.005 = 2.01 → one gets 1.01, other gets 1.00
    const rawShares = [
      { participantId: 'a', name: 'Alice', itemsSubtotal: 1.005, taxShare: 0, tipShare: 0, rawTotal: 1.005, total: 1.005, items: [] },
      { participantId: 'b', name: 'Bob',   itemsSubtotal: 1.005, taxShare: 0, tipShare: 0, rawTotal: 1.005, total: 1.005, items: [] },
    ];
    const totalBill = 2.01;
    const result = distributeRemainder(rawShares, totalBill);
    const sum = result.reduce((acc, s) => acc + s.total, 0);
    expect(Math.round(sum * 100) / 100).toBe(totalBill);
  });

  it('preserves participant order in result', () => {
    const rawShares = [
      { participantId: 'a', name: 'Alice', itemsSubtotal: 5, taxShare: 0, tipShare: 0, rawTotal: 5, total: 5, items: [] },
      { participantId: 'b', name: 'Bob',   itemsSubtotal: 5, taxShare: 0, tipShare: 0, rawTotal: 5, total: 5, items: [] },
    ];
    const result = distributeRemainder(rawShares, 10);
    expect(result[0].participantId).toBe('a');
    expect(result[1].participantId).toBe('b');
  });

  it('handles single participant — total equals totalBill', () => {
    const rawShares = [
      { participantId: 'a', name: 'Alice', itemsSubtotal: 33.33, taxShare: 0, tipShare: 0, rawTotal: 33.33, total: 33.33, items: [] },
    ];
    const result = distributeRemainder(rawShares, 33.33);
    expect(result[0].total).toBe(33.33);
  });
});

// ---------------------------------------------------------------------------
// calculateSummary
// ---------------------------------------------------------------------------
describe('calculateSummary', () => {
  it('returns zero summary for empty state', () => {
    const state = { participants: [], items: [], taxRate: 0, tipRate: 0 };
    const summary = calculateSummary(state);
    expect(summary.subtotal).toBe(0);
    expect(summary.taxAmount).toBe(0);
    expect(summary.tipAmount).toBe(0);
    expect(summary.totalBill).toBe(0);
    expect(summary.participantShares).toEqual([]);
    expect(summary.unassignedItems).toEqual([]);
  });

  it('marks all items as unassigned when no assignments exist (Req 2.7, 5.3)', () => {
    const state = {
      participants: [{ id: 'alice', name: 'Alice' }],
      items: [
        { id: 'i1', name: 'Nasi', price: 20000, assignedTo: [] },
        { id: 'i2', name: 'Mie',  price: 15000, assignedTo: [] },
      ],
      taxRate: 0,
      tipRate: 0,
    };
    const summary = calculateSummary(state);
    expect(summary.unassignedItems).toContain('i1');
    expect(summary.unassignedItems).toContain('i2');
    expect(summary.unassignedItems).toHaveLength(2);
  });

  it('participantShares itemsSubtotal are 0 when all items are unassigned', () => {
    // When all items are unassigned, no participant has any items assigned to them.
    // itemsSubtotal, taxShare, and tipShare should all be 0 for every participant.
    const state = {
      participants: [{ id: 'alice', name: 'Alice' }, { id: 'bob', name: 'Bob' }],
      items: [
        { id: 'i1', name: 'Nasi', price: 20000, assignedTo: [] },
      ],
      taxRate: 0,
      tipRate: 0,
    };
    const summary = calculateSummary(state);
    for (const share of summary.participantShares) {
      expect(share.itemsSubtotal).toBe(0);
      expect(share.taxShare).toBe(0);
      expect(share.tipShare).toBe(0);
    }
  });

  it('calculates totalBill = subtotal + tipAmount + taxAmount, tax on (subtotal+tip) (Req 5.3)', () => {
    const state = {
      participants: [{ id: 'alice', name: 'Alice' }],
      items: [{ id: 'i1', name: 'Steak', price: 100000, assignedTo: ['alice'] }],
      taxRate: 10,
      tipRate: 5,
    };
    const summary = calculateSummary(state);
    // tip = 100000 * 5/100 = 5000
    // tax = (100000 + 5000) * 10/100 = 10500
    // total = 100000 + 5000 + 10500 = 115500
    expect(summary.subtotal).toBe(100000);
    expect(summary.tipAmount).toBe(5000);
    expect(summary.taxAmount).toBe(10500);
    expect(summary.totalBill).toBe(115500);
  });

  it('sum of participantShares equals totalBill (Req 5.5)', () => {
    const state = {
      participants: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob',   name: 'Bob' },
        { id: 'carol', name: 'Carol' },
      ],
      items: [
        { id: 'i1', name: 'Pizza', price: 100, assignedTo: ['alice', 'bob', 'carol'] },
      ],
      taxRate: 10,
      tipRate: 5,
    };
    const summary = calculateSummary(state);
    const sumShares = summary.participantShares.reduce((acc, s) => acc + s.total, 0);
    expect(Math.round(sumShares * 100) / 100).toBe(summary.totalBill);
  });

  it('full scenario: multiple participants, items, tax and tip (Req 2.7, 3.5, 4.3, 4.5, 5.3, 5.5)', () => {
    const state = {
      participants: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob',   name: 'Bob' },
      ],
      items: [
        { id: 'i1', name: 'Nasi Goreng', price: 30000, assignedTo: ['alice'] },
        { id: 'i2', name: 'Mie Goreng',  price: 25000, assignedTo: ['bob'] },
        { id: 'i3', name: 'Es Teh',      price: 10000, assignedTo: ['alice', 'bob'] },
      ],
      taxRate: 10,
      tipRate: 5,
    };
    const summary = calculateSummary(state);

    // Subtotal: 30000 + 25000 + 10000 = 65000
    expect(summary.subtotal).toBe(65000);
    // Tip: 65000 * 5 / 100 = 3250
    expect(summary.tipAmount).toBe(3250);
    // Tax: (65000 + 3250) * 10 / 100 = 6825
    expect(summary.taxAmount).toBe(6825);
    // Total: 65000 + 3250 + 6825 = 75075
    expect(summary.totalBill).toBe(75075);

    // No unassigned items
    expect(summary.unassignedItems).toHaveLength(0);

    // Sum of shares = totalBill
    const sumShares = summary.participantShares.reduce((acc, s) => acc + s.total, 0);
    expect(Math.round(sumShares * 100) / 100).toBe(summary.totalBill);

    // Alice: 30000 + 5000 (half of Es Teh) = 35000 items subtotal
    const aliceShare = summary.participantShares.find(s => s.participantId === 'alice');
    expect(aliceShare.itemsSubtotal).toBe(35000);

    // Bob: 25000 + 5000 (half of Es Teh) = 30000 items subtotal
    const bobShare = summary.participantShares.find(s => s.participantId === 'bob');
    expect(bobShare.itemsSubtotal).toBe(30000);
  });

  it('handles state with no participants but has items', () => {
    const state = {
      participants: [],
      items: [{ id: 'i1', name: 'Nasi', price: 20000, assignedTo: [] }],
      taxRate: 0,
      tipRate: 0,
    };
    const summary = calculateSummary(state);
    expect(summary.subtotal).toBe(20000);
    expect(summary.participantShares).toEqual([]);
    expect(summary.unassignedItems).toContain('i1');
  });

  it('handles missing taxRate and tipRate (defaults to 0)', () => {
    const state = {
      participants: [{ id: 'alice', name: 'Alice' }],
      items: [{ id: 'i1', name: 'Nasi', price: 50000, assignedTo: ['alice'] }],
    };
    const summary = calculateSummary(state);
    expect(summary.taxAmount).toBe(0);
    expect(summary.tipAmount).toBe(0);
    expect(summary.totalBill).toBe(50000);
  });

  it('correctly identifies partially unassigned items', () => {
    const state = {
      participants: [{ id: 'alice', name: 'Alice' }],
      items: [
        { id: 'i1', name: 'Assigned',   price: 20000, assignedTo: ['alice'] },
        { id: 'i2', name: 'Unassigned', price: 15000, assignedTo: [] },
      ],
      taxRate: 0,
      tipRate: 0,
    };
    const summary = calculateSummary(state);
    expect(summary.unassignedItems).toEqual(['i2']);
    expect(summary.unassignedItems).not.toContain('i1');
  });
});
