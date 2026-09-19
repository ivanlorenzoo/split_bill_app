// Unit tests untuk summaryPanel.js
// Requirements: 5.1, 5.3, 5.6

import { describe, it, expect, beforeEach } from 'vitest';
import { renderSummaryPanel } from '../../components/summaryPanel.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: buat mock summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Buat mock Summary untuk keperluan testing.
 *
 * @param {object} overrides - Override properti summary
 * @returns {object} Mock summary
 */
function createMockSummary(overrides = {}) {
  return {
    subtotal: 0,
    taxAmount: 0,
    tipAmount: 0,
    totalBill: 0,
    participantShares: [],
    unassignedItems: [],
    ...overrides,
  };
}

/**
 * Buat mock ParticipantShare untuk keperluan testing.
 *
 * @param {object} overrides - Override properti share
 * @returns {object} Mock participant share
 */
function createMockShare(overrides = {}) {
  return {
    participantId: 'p1',
    name: 'Alice',
    itemsSubtotal: 100000,
    taxShare: 0,
    tipShare: 0,
    total: 100000,
    items: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Render dasar
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — render dasar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender tanpa error dengan summary kosong', () => {
    const summary = createMockSummary();
    expect(() => renderSummaryPanel(summary, container)).not.toThrow();
  });

  it('mengosongkan container sebelum render ulang', () => {
    const summary = createMockSummary();
    container.innerHTML = '<p>konten lama</p>';
    renderSummaryPanel(summary, container);
    expect(container.querySelector('p')?.textContent).not.toBe('konten lama');
  });

  it('merender judul panel "Ringkasan"', () => {
    const summary = createMockSummary();
    renderSummaryPanel(summary, container);
    const title = container.querySelector('.panel-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Ringkasan');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seksi total — Req 5.3
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — seksi total (Req 5.3)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender elemen .summary-total — Req 5.3', () => {
    const summary = createMockSummary();
    renderSummaryPanel(summary, container);
    const totalSection = container.querySelector('.summary-total');
    expect(totalSection).not.toBeNull();
  });

  it('menampilkan baris subtotal dengan nilai yang benar — Req 5.3', () => {
    const summary = createMockSummary({ subtotal: 100000, totalBill: 100000 });
    renderSummaryPanel(summary, container);
    const rows = container.querySelectorAll('.summary-breakdown-row');
    const subtotalRow = Array.from(rows).find((r) => r.textContent.includes('Subtotal'));
    expect(subtotalRow).not.toBeNull();
    expect(subtotalRow.textContent).toContain('100.000,00');
  });

  it('menampilkan baris grand total (.summary-grand-total) dengan totalBill — Req 5.3', () => {
    const summary = createMockSummary({ subtotal: 100000, totalBill: 110000 });
    renderSummaryPanel(summary, container);
    const grandTotal = container.querySelector('.summary-grand-total');
    expect(grandTotal).not.toBeNull();
    expect(grandTotal.textContent).toContain('110.000,00');
  });

  it('grand total menampilkan label "Total" — Req 5.3', () => {
    const summary = createMockSummary({ totalBill: 100000 });
    renderSummaryPanel(summary, container);
    const grandTotal = container.querySelector('.summary-grand-total');
    expect(grandTotal.textContent).toContain('Total');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Baris pajak dan tip di total — Req 5.3
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — baris pajak dan tip di total (Req 5.3)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('baris pajak ditampilkan saat taxAmount > 0 — Req 5.3', () => {
    const summary = createMockSummary({
      subtotal: 100000,
      taxAmount: 10000,
      totalBill: 110000,
    });
    renderSummaryPanel(summary, container);
    const rows = container.querySelectorAll('.summary-breakdown-row');
    const taxRow = Array.from(rows).find((r) => r.textContent.includes('Pajak'));
    expect(taxRow).not.toBeNull();
    expect(taxRow.textContent).toContain('10.000,00');
  });

  it('baris tip ditampilkan saat tipAmount > 0 — Req 5.3', () => {
    const summary = createMockSummary({
      subtotal: 100000,
      tipAmount: 5000,
      totalBill: 105000,
    });
    renderSummaryPanel(summary, container);
    const rows = container.querySelectorAll('.summary-breakdown-row');
    const tipRow = Array.from(rows).find((r) => r.textContent.includes('Tip'));
    expect(tipRow).not.toBeNull();
    expect(tipRow.textContent).toContain('5.000,00');
  });

  it('baris pajak tidak ditampilkan saat taxAmount = 0 — Req 5.3', () => {
    const summary = createMockSummary({ subtotal: 100000, taxAmount: 0, totalBill: 100000 });
    renderSummaryPanel(summary, container);
    const rows = container.querySelectorAll('.summary-breakdown-row');
    const taxRow = Array.from(rows).find((r) => r.textContent.includes('Pajak'));
    expect(taxRow).toBeUndefined();
  });

  it('baris tip tidak ditampilkan saat tipAmount = 0 — Req 5.3', () => {
    const summary = createMockSummary({ subtotal: 100000, tipAmount: 0, totalBill: 100000 });
    renderSummaryPanel(summary, container);
    const rows = container.querySelectorAll('.summary-breakdown-row');
    const tipRow = Array.from(rows).find((r) => r.textContent.includes('Tip'));
    expect(tipRow).toBeUndefined();
  });

  it('baris pajak dan tip keduanya tidak ditampilkan saat keduanya 0 — Req 5.3', () => {
    const summary = createMockSummary({ subtotal: 100000, taxAmount: 0, tipAmount: 0, totalBill: 100000 });
    renderSummaryPanel(summary, container);
    // Hanya ada 2 baris: subtotal dan grand total
    const rows = container.querySelectorAll('.summary-breakdown-row');
    expect(rows.length).toBe(2);
  });

  it('baris pajak dan tip keduanya ditampilkan saat keduanya > 0 — Req 5.3', () => {
    const summary = createMockSummary({
      subtotal: 100000,
      taxAmount: 10000,
      tipAmount: 5000,
      totalBill: 115000,
    });
    renderSummaryPanel(summary, container);
    // Ada 4 baris: subtotal, pajak, tip, grand total
    const rows = container.querySelectorAll('.summary-breakdown-row');
    expect(rows.length).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — empty state', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('menampilkan .empty-state saat participantShares kosong', () => {
    const summary = createMockSummary({ participantShares: [] });
    renderSummaryPanel(summary, container);
    const empty = container.querySelector('.empty-state');
    expect(empty).not.toBeNull();
  });

  it('tidak menampilkan .participant-summary-list saat participantShares kosong', () => {
    const summary = createMockSummary({ participantShares: [] });
    renderSummaryPanel(summary, container);
    const list = container.querySelector('.participant-summary-list');
    expect(list).toBeNull();
  });

  it('tidak menampilkan .empty-state saat ada participantShares', () => {
    const summary = createMockSummary({
      subtotal: 100000,
      totalBill: 100000,
      participantShares: [createMockShare()],
    });
    renderSummaryPanel(summary, container);
    const empty = container.querySelector('.empty-state');
    expect(empty).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Kartu peserta — Req 5.1
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — kartu peserta (Req 5.1)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender .participant-summary-list saat ada peserta — Req 5.1', () => {
    const summary = createMockSummary({
      participantShares: [createMockShare()],
    });
    renderSummaryPanel(summary, container);
    const list = container.querySelector('.participant-summary-list');
    expect(list).not.toBeNull();
  });

  it('merender satu kartu per peserta — Req 5.1', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({ participantId: 'p1', name: 'Alice', total: 50000 }),
        createMockShare({ participantId: 'p2', name: 'Bob', total: 50000 }),
      ],
    });
    renderSummaryPanel(summary, container);
    const cards = container.querySelectorAll('.participant-summary-card');
    expect(cards.length).toBe(2);
  });

  it('setiap kartu menampilkan nama peserta — Req 5.1', () => {
    const summary = createMockSummary({
      participantShares: [createMockShare({ name: 'Alice' })],
    });
    renderSummaryPanel(summary, container);
    const nameEl = container.querySelector('.participant-summary-name');
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toBe('Alice');
  });

  it('setiap kartu menampilkan total peserta — Req 5.1', () => {
    const summary = createMockSummary({
      participantShares: [createMockShare({ name: 'Alice', total: 75000 })],
    });
    renderSummaryPanel(summary, container);
    const totalEl = container.querySelector('.participant-summary-total');
    expect(totalEl).not.toBeNull();
    expect(totalEl.textContent).toBe('75.000,00');
  });

  it('setiap kartu memiliki header (.participant-summary-header) — Req 5.1', () => {
    const summary = createMockSummary({
      participantShares: [createMockShare()],
    });
    renderSummaryPanel(summary, container);
    const header = container.querySelector('.participant-summary-header');
    expect(header).not.toBeNull();
  });

  it('merender tiga kartu untuk tiga peserta — Req 5.1', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({ participantId: 'p1', name: 'Alice', total: 30000 }),
        createMockShare({ participantId: 'p2', name: 'Bob', total: 40000 }),
        createMockShare({ participantId: 'p3', name: 'Carol', total: 30000 }),
      ],
    });
    renderSummaryPanel(summary, container);
    const cards = container.querySelectorAll('.participant-summary-card');
    expect(cards.length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rincian item per peserta — Req 5.6
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — rincian item per peserta (Req 5.6)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('kartu menampilkan .participant-summary-items saat ada items — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          items: [{ itemId: 'i1', name: 'Nasi Goreng', share: 25000 }],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemsSection = container.querySelector('.participant-summary-items');
    expect(itemsSection).not.toBeNull();
  });

  it('kartu menampilkan baris item dengan nama dan nilai share — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          items: [{ itemId: 'i1', name: 'Nasi Goreng', share: 25000 }],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemRows = container.querySelectorAll('.participant-summary-item');
    expect(itemRows.length).toBeGreaterThan(0);
    const firstRow = itemRows[0];
    expect(firstRow.textContent).toContain('Nasi Goreng');
    expect(firstRow.textContent).toContain('25.000,00');
  });

  it('kartu menampilkan beberapa baris item — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          items: [
            { itemId: 'i1', name: 'Nasi Goreng', share: 25000 },
            { itemId: 'i2', name: 'Es Teh', share: 5000 },
          ],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemRows = container.querySelectorAll('.participant-summary-item');
    expect(itemRows.length).toBe(2);
  });

  it('baris pajak ditampilkan di kartu saat taxShare > 0 — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          taxShare: 5000,
          items: [{ itemId: 'i1', name: 'Nasi Goreng', share: 50000 }],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemRows = container.querySelectorAll('.participant-summary-item');
    const taxRow = Array.from(itemRows).find((r) => r.textContent.includes('Pajak'));
    expect(taxRow).not.toBeNull();
    expect(taxRow.textContent).toContain('5.000,00');
  });

  it('baris tip ditampilkan di kartu saat tipShare > 0 — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          tipShare: 2500,
          items: [{ itemId: 'i1', name: 'Nasi Goreng', share: 50000 }],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemRows = container.querySelectorAll('.participant-summary-item');
    const tipRow = Array.from(itemRows).find((r) => r.textContent.includes('Tip'));
    expect(tipRow).not.toBeNull();
    expect(tipRow.textContent).toContain('2.500,00');
  });

  it('baris pajak tidak ditampilkan di kartu saat taxShare = 0 — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          taxShare: 0,
          items: [{ itemId: 'i1', name: 'Nasi Goreng', share: 50000 }],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemRows = container.querySelectorAll('.participant-summary-item');
    const taxRow = Array.from(itemRows).find((r) => r.textContent.includes('Pajak'));
    expect(taxRow).toBeUndefined();
  });

  it('baris tip tidak ditampilkan di kartu saat tipShare = 0 — Req 5.6', () => {
    const summary = createMockSummary({
      participantShares: [
        createMockShare({
          tipShare: 0,
          items: [{ itemId: 'i1', name: 'Nasi Goreng', share: 50000 }],
        }),
      ],
    });
    renderSummaryPanel(summary, container);
    const itemRows = container.querySelectorAll('.participant-summary-item');
    const tipRow = Array.from(itemRows).find((r) => r.textContent.includes('Tip'));
    expect(tipRow).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Item belum ditugaskan — Req 5.6
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — item belum ditugaskan (Req 5.6)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('menampilkan .unassigned-section saat unassignedItems.length > 0 — Req 5.6', () => {
    const summary = createMockSummary({ unassignedItems: ['item-1', 'item-2'] });
    renderSummaryPanel(summary, container);
    const section = container.querySelector('.unassigned-section');
    expect(section).not.toBeNull();
  });

  it('.unassigned-section memiliki role="alert" — Req 5.6', () => {
    const summary = createMockSummary({ unassignedItems: ['item-1'] });
    renderSummaryPanel(summary, container);
    const section = container.querySelector('.unassigned-section');
    expect(section.getAttribute('role')).toBe('alert');
  });

  it('tidak menampilkan .unassigned-section saat unassignedItems kosong — Req 5.6', () => {
    const summary = createMockSummary({ unassignedItems: [] });
    renderSummaryPanel(summary, container);
    const section = container.querySelector('.unassigned-section');
    expect(section).toBeNull();
  });

  it('tidak menampilkan .unassigned-section saat unassignedItems undefined — Req 5.6', () => {
    const summary = createMockSummary({ unassignedItems: undefined });
    renderSummaryPanel(summary, container);
    const section = container.querySelector('.unassigned-section');
    expect(section).toBeNull();
  });

  it('.unassigned-section menampilkan jumlah item yang belum ditugaskan — Req 5.6', () => {
    const summary = createMockSummary({ unassignedItems: ['item-1', 'item-2', 'item-3'] });
    renderSummaryPanel(summary, container);
    const section = container.querySelector('.unassigned-section');
    expect(section.textContent).toContain('3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Aksesibilitas
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — aksesibilitas', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('.summary-total memiliki aria-label', () => {
    const summary = createMockSummary({ totalBill: 100000 });
    renderSummaryPanel(summary, container);
    const totalSection = container.querySelector('.summary-total');
    expect(totalSection.getAttribute('aria-label')).toBeTruthy();
  });

  it('.summary-total aria-label menyebutkan nilai totalBill', () => {
    const summary = createMockSummary({ totalBill: 100000 });
    renderSummaryPanel(summary, container);
    const totalSection = container.querySelector('.summary-total');
    expect(totalSection.getAttribute('aria-label')).toContain('100.000,00');
  });

  it('kartu peserta memiliki aria-label yang menyebutkan nama dan total', () => {
    const summary = createMockSummary({
      participantShares: [createMockShare({ name: 'Alice', total: 75000 })],
    });
    renderSummaryPanel(summary, container);
    const card = container.querySelector('.participant-summary-card');
    const ariaLabel = card.getAttribute('aria-label');
    expect(ariaLabel).toContain('Alice');
    expect(ariaLabel).toContain('75.000,00');
  });

  it('.unassigned-section memiliki aria-label yang menyebutkan jumlah item', () => {
    const summary = createMockSummary({ unassignedItems: ['item-1', 'item-2'] });
    renderSummaryPanel(summary, container);
    const section = container.querySelector('.unassigned-section');
    expect(section.getAttribute('aria-label')).toContain('2');
  });

  it('.participant-summary-list memiliki aria-label', () => {
    const summary = createMockSummary({
      participantShares: [createMockShare()],
    });
    renderSummaryPanel(summary, container);
    const list = container.querySelector('.participant-summary-list');
    expect(list.getAttribute('aria-label')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Re-render
// ─────────────────────────────────────────────────────────────────────────────

describe('renderSummaryPanel — re-render', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('re-render mencerminkan data summary terbaru', () => {
    const summary = createMockSummary({ subtotal: 50000, totalBill: 50000 });
    renderSummaryPanel(summary, container);
    expect(container.querySelector('.summary-grand-total').textContent).toContain('50.000,00');

    const updatedSummary = createMockSummary({ subtotal: 100000, totalBill: 110000, taxAmount: 10000 });
    renderSummaryPanel(updatedSummary, container);
    expect(container.querySelector('.summary-grand-total').textContent).toContain('110.000,00');
  });

  it('re-render tidak menduplikasi judul panel', () => {
    const summary = createMockSummary();
    renderSummaryPanel(summary, container);
    renderSummaryPanel(summary, container);
    const titles = container.querySelectorAll('.panel-title');
    expect(titles.length).toBe(1);
  });

  it('re-render memperbarui daftar peserta', () => {
    const summary1 = createMockSummary({
      participantShares: [createMockShare({ participantId: 'p1', name: 'Alice', total: 50000 })],
    });
    renderSummaryPanel(summary1, container);
    expect(container.querySelectorAll('.participant-summary-card').length).toBe(1);

    const summary2 = createMockSummary({
      participantShares: [
        createMockShare({ participantId: 'p1', name: 'Alice', total: 50000 }),
        createMockShare({ participantId: 'p2', name: 'Bob', total: 50000 }),
      ],
    });
    renderSummaryPanel(summary2, container);
    expect(container.querySelectorAll('.participant-summary-card').length).toBe(2);
  });

  it('re-render menghapus .unassigned-section saat unassignedItems menjadi kosong', () => {
    const summary1 = createMockSummary({ unassignedItems: ['item-1'] });
    renderSummaryPanel(summary1, container);
    expect(container.querySelector('.unassigned-section')).not.toBeNull();

    const summary2 = createMockSummary({ unassignedItems: [] });
    renderSummaryPanel(summary2, container);
    expect(container.querySelector('.unassigned-section')).toBeNull();
  });
});
