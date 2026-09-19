// Unit tests untuk billPanel.js
// Requirements: 2.1, 2.7, 3.4, 3.7, 3.8

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderBillPanel } from '../../components/billPanel.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: buat mock state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Buat mock AppState untuk keperluan testing.
 *
 * @param {object} overrides - Override properti state
 * @returns {object} Mock state
 */
function createMockState(overrides = {}) {
  return {
    participants: [],
    items: [],
    taxRate: 0,
    tipRate: 0,
    addItem: vi.fn(() => ({ success: true })),
    removeItem: vi.fn(),
    assignParticipant: vi.fn(),
    removeAssignment: vi.fn(),
    assignAll: vi.fn(),
    ...overrides,
  };
}

/**
 * Buat mock item tagihan.
 *
 * @param {object} overrides - Override properti item
 * @returns {object} Mock item
 */
function createMockItem(overrides = {}) {
  return {
    id: 'item-1',
    name: 'Nasi Goreng',
    price: 25000,
    assignedTo: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Render dasar
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — render dasar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender tanpa error dengan state kosong', () => {
    const state = createMockState();
    expect(() => renderBillPanel(state, container)).not.toThrow();
  });

  it('mengosongkan container sebelum render ulang', () => {
    const state = createMockState();
    container.innerHTML = '<p>konten lama</p>';
    renderBillPanel(state, container);
    expect(container.querySelector('p')?.textContent).not.toBe('konten lama');
  });

  it('merender judul panel "Item Tagihan"', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const title = container.querySelector('.panel-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Item Tagihan');
  });

  it('merender daftar item (ul.item-list)', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const list = container.querySelector('.item-list');
    expect(list).not.toBeNull();
  });

  it('menampilkan pesan kosong jika tidak ada item', () => {
    const state = createMockState({ items: [] });
    renderBillPanel(state, container);
    const empty = container.querySelector('.empty-state');
    expect(empty).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Form tambah item — Req 2.1
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — form tambah item (Req 2.1)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender form tambah item — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
  });

  it('form memiliki input teks untuk nama item — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const nameInput = container.querySelector('input[type="text"]');
    expect(nameInput).not.toBeNull();
  });

  it('input nama memiliki placeholder "Nama item" — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const nameInput = container.querySelector('input[type="text"]');
    expect(nameInput.placeholder).toBe('Nama item');
  });

  it('form memiliki input angka untuk harga — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const priceInput = container.querySelector('input[type="number"]');
    expect(priceInput).not.toBeNull();
  });

  it('form memiliki tombol submit "Tambah" — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Tambah');
  });

  it('form memiliki aria-label — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const form = container.querySelector('form');
    expect(form.getAttribute('aria-label')).toBeTruthy();
  });

  it('memanggil state.addItem dengan nama dan harga saat form disubmit — Req 2.1', () => {
    const state = createMockState();
    renderBillPanel(state, container);

    const nameInput = container.querySelector('input[type="text"]');
    const priceInput = container.querySelector('input[type="number"]');
    const form = container.querySelector('form');

    nameInput.value = 'Nasi Goreng';
    priceInput.value = '25000';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(state.addItem).toHaveBeenCalledWith('Nasi Goreng', 25000);
  });

  it('mengosongkan input setelah submit berhasil — Req 2.1', () => {
    const state = createMockState({
      addItem: vi.fn(() => ({ success: true })),
    });
    renderBillPanel(state, container);

    const nameInput = container.querySelector('input[type="text"]');
    const priceInput = container.querySelector('input[type="number"]');
    const form = container.querySelector('form');

    nameInput.value = 'Nasi Goreng';
    priceInput.value = '25000';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(nameInput.value).toBe('');
    expect(priceInput.value).toBe('');
  });

  it('menampilkan pesan error jika addItem mengembalikan success=false — Req 2.1', () => {
    const state = createMockState({
      addItem: vi.fn(() => ({ success: false, error: 'Nama item tidak boleh kosong' })),
    });
    renderBillPanel(state, container);

    const form = container.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const errorEl = container.querySelector('[role="alert"]');
    expect(errorEl.classList.contains('visible')).toBe(true);
    expect(errorEl.textContent).toBe('Nama item tidak boleh kosong');
  });

  it('error hilang saat user mulai mengetik ulang di input nama', () => {
    const state = createMockState({
      addItem: vi.fn(() => ({ success: false, error: 'Nama item tidak boleh kosong' })),
    });
    renderBillPanel(state, container);

    const form = container.querySelector('form');
    const nameInput = container.querySelector('input[type="text"]');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const errorEl = container.querySelector('[role="alert"]');
    expect(errorEl.classList.contains('visible')).toBe(true);

    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    expect(errorEl.classList.contains('visible')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Render item dengan assignment — Req 3.4
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — item dengan assignment (Req 3.4)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender elemen li untuk setiap item — Req 3.4', () => {
    const state = createMockState({
      items: [
        createMockItem({ id: 'item-1', name: 'Nasi Goreng', price: 25000 }),
        createMockItem({ id: 'item-2', name: 'Es Teh', price: 5000 }),
      ],
    });
    renderBillPanel(state, container);
    const items = container.querySelectorAll('.bill-item');
    expect(items.length).toBe(2);
  });

  it('setiap item menampilkan nama item — Req 3.4', () => {
    const state = createMockState({
      items: [createMockItem({ name: 'Nasi Goreng' })],
    });
    renderBillPanel(state, container);
    const nameEl = container.querySelector('.bill-item-name');
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toBe('Nasi Goreng');
  });

  it('setiap item menampilkan harga item — Req 3.4', () => {
    const state = createMockState({
      items: [createMockItem({ price: 25000 })],
    });
    renderBillPanel(state, container);
    const priceEl = container.querySelector('.bill-item-price');
    expect(priceEl).not.toBeNull();
    // Format ID: 25000 → "25.000,00"
    expect(priceEl.textContent).toBe('25.000,00');
  });

  it('item memiliki atribut data-item-id — Req 3.4', () => {
    const state = createMockState({
      items: [createMockItem({ id: 'item-abc' })],
    });
    renderBillPanel(state, container);
    const li = container.querySelector('.bill-item');
    expect(li.getAttribute('data-item-id')).toBe('item-abc');
  });

  it('menampilkan badge/chip untuk setiap peserta yang di-assign ke item — Req 3.4', () => {
    const state = createMockState({
      participants: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      items: [
        createMockItem({ assignedTo: ['p1', 'p2'] }),
      ],
    });
    renderBillPanel(state, container);
    const badges = container.querySelectorAll('.assignment-badge');
    expect(badges.length).toBe(2);
  });

  it('badge menampilkan nama peserta yang di-assign — Req 3.4', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem({ assignedTo: ['p1'] })],
    });
    renderBillPanel(state, container);
    const badge = container.querySelector('.assignment-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Alice');
  });

  it('badge memiliki aria-label yang menyebutkan nama peserta dan item — Req 3.4', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem({ name: 'Nasi Goreng', assignedTo: ['p1'] })],
    });
    renderBillPanel(state, container);
    const badge = container.querySelector('.assignment-badge');
    expect(badge.getAttribute('aria-label')).toContain('Alice');
    expect(badge.getAttribute('aria-label')).toContain('Nasi Goreng');
  });

  it('badge memiliki tombol hapus assignment — Req 3.4', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem({ assignedTo: ['p1'] })],
    });
    renderBillPanel(state, container);
    const removeBtn = container.querySelector('.assignment-badge .remove-btn');
    expect(removeBtn).not.toBeNull();
  });

  it('klik tombol hapus badge memanggil state.removeAssignment — Req 3.4', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem({ id: 'item-1', assignedTo: ['p1'] })],
    });
    renderBillPanel(state, container);
    const removeBtn = container.querySelector('.assignment-badge .remove-btn');
    removeBtn.click();
    expect(state.removeAssignment).toHaveBeenCalledWith('item-1', 'p1');
  });

  it('tidak menampilkan badge jika peserta sudah dihapus dari state — Req 3.4', () => {
    // assignedTo berisi id yang tidak ada di participants
    const state = createMockState({
      participants: [],
      items: [createMockItem({ assignedTo: ['p-deleted'] })],
    });
    renderBillPanel(state, container);
    const badges = container.querySelectorAll('.assignment-badge');
    expect(badges.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Item tanpa assignment — warning (Req 3.7)
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — item tanpa assignment (Req 3.7)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('item tanpa assignment memiliki class "unassigned-warning" — Req 3.7', () => {
    const state = createMockState({
      items: [createMockItem({ assignedTo: [] })],
    });
    renderBillPanel(state, container);
    const li = container.querySelector('.bill-item');
    expect(li.classList.contains('unassigned-warning')).toBe(true);
  });

  it('item dengan assignment tidak memiliki class "unassigned-warning" — Req 3.7', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem({ assignedTo: ['p1'] })],
    });
    renderBillPanel(state, container);
    const li = container.querySelector('.bill-item');
    expect(li.classList.contains('unassigned-warning')).toBe(false);
  });

  it('item tanpa assignment memiliki aria-label yang menyebutkan "belum ditugaskan" — Req 3.7', () => {
    const state = createMockState({
      items: [createMockItem({ assignedTo: [] })],
    });
    renderBillPanel(state, container);
    const li = container.querySelector('.bill-item');
    expect(li.getAttribute('aria-label')).toContain('belum ditugaskan');
  });

  it('item tanpa assignment memiliki area assignments dengan aria-label yang sesuai — Req 3.7', () => {
    const state = createMockState({
      items: [createMockItem({ name: 'Nasi Goreng', assignedTo: [] })],
    });
    renderBillPanel(state, container);
    const assignmentsDiv = container.querySelector('.bill-item-assignments');
    expect(assignmentsDiv).not.toBeNull();
    expect(assignmentsDiv.getAttribute('aria-label')).toContain('belum ditugaskan');
  });

  it('item dengan assignedTo=undefined juga dianggap belum ditugaskan — Req 3.7', () => {
    const state = createMockState({
      items: [createMockItem({ assignedTo: undefined })],
    });
    renderBillPanel(state, container);
    const li = container.querySelector('.bill-item');
    expect(li.classList.contains('unassigned-warning')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Subtotal — Req 2.7
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — subtotal (Req 2.7)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender baris subtotal (.subtotal-row) — Req 2.7', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const subtotalRow = container.querySelector('.subtotal-row');
    expect(subtotalRow).not.toBeNull();
  });

  it('menampilkan label "Subtotal" — Req 2.7', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    const subtotalRow = container.querySelector('.subtotal-row');
    expect(subtotalRow.textContent).toContain('Subtotal');
  });

  it('menampilkan nilai subtotal 0 jika tidak ada item — Req 2.7', () => {
    const state = createMockState({ items: [] });
    renderBillPanel(state, container);
    const subtotalValue = container.querySelector('.subtotal-value');
    expect(subtotalValue).not.toBeNull();
    expect(subtotalValue.textContent).toBe('0,00');
  });

  it('menampilkan subtotal yang benar untuk satu item — Req 2.7', () => {
    const state = createMockState({
      items: [createMockItem({ price: 25000 })],
    });
    renderBillPanel(state, container);
    const subtotalValue = container.querySelector('.subtotal-value');
    // 25000 → "25.000,00" (format id-ID)
    expect(subtotalValue.textContent).toBe('25.000,00');
  });

  it('menampilkan subtotal yang benar untuk beberapa item — Req 2.7', () => {
    const state = createMockState({
      items: [
        createMockItem({ id: 'item-1', price: 25000 }),
        createMockItem({ id: 'item-2', price: 15000 }),
        createMockItem({ id: 'item-3', price: 10000 }),
      ],
    });
    renderBillPanel(state, container);
    const subtotalValue = container.querySelector('.subtotal-value');
    // 25000 + 15000 + 10000 = 50000 → "50.000,00"
    expect(subtotalValue.textContent).toBe('50.000,00');
  });

  it('subtotal-row memiliki aria-label dengan nilai subtotal — Req 2.7', () => {
    const state = createMockState({
      items: [createMockItem({ price: 25000 })],
    });
    renderBillPanel(state, container);
    const subtotalRow = container.querySelector('.subtotal-row');
    expect(subtotalRow.getAttribute('aria-label')).toContain('25.000,00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tombol "Tugaskan Semua" — Req 3.8
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — tombol "Tugaskan Semua" (Req 3.8)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('setiap item memiliki tombol "Tugaskan Semua" — Req 3.8', () => {
    const state = createMockState({
      items: [
        createMockItem({ id: 'item-1', name: 'Nasi Goreng' }),
        createMockItem({ id: 'item-2', name: 'Es Teh' }),
      ],
    });
    renderBillPanel(state, container);
    const assignAllBtns = container.querySelectorAll('button');
    const tugaskanBtns = Array.from(assignAllBtns).filter(
      (btn) => btn.textContent === 'Tugaskan Semua'
    );
    expect(tugaskanBtns.length).toBe(2);
  });

  it('tombol "Tugaskan Semua" memiliki aria-label yang menyebutkan nama item — Req 3.8', () => {
    const state = createMockState({
      items: [createMockItem({ name: 'Nasi Goreng' })],
    });
    renderBillPanel(state, container);
    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Tugaskan Semua'
    );
    expect(btn.getAttribute('aria-label')).toContain('Nasi Goreng');
  });

  it('tombol "Tugaskan Semua" disabled jika tidak ada peserta — Req 3.8', () => {
    const state = createMockState({
      participants: [],
      items: [createMockItem()],
    });
    renderBillPanel(state, container);
    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Tugaskan Semua'
    );
    expect(btn.disabled).toBe(true);
  });

  it('tombol "Tugaskan Semua" enabled jika ada peserta — Req 3.8', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem()],
    });
    renderBillPanel(state, container);
    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Tugaskan Semua'
    );
    expect(btn.disabled).toBe(false);
  });

  it('klik tombol "Tugaskan Semua" memanggil state.assignAll dengan id item — Req 3.8', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [createMockItem({ id: 'item-1' })],
    });
    renderBillPanel(state, container);
    const btn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Tugaskan Semua'
    );
    btn.click();
    expect(state.assignAll).toHaveBeenCalledWith('item-1');
  });

  it('klik tombol "Tugaskan Semua" pada item yang benar saat ada beberapa item — Req 3.8', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
      items: [
        createMockItem({ id: 'item-1', name: 'Nasi Goreng' }),
        createMockItem({ id: 'item-2', name: 'Es Teh' }),
      ],
    });
    renderBillPanel(state, container);

    const allItems = container.querySelectorAll('.bill-item');
    // Klik tombol "Tugaskan Semua" pada item kedua
    const secondItemBtn = Array.from(allItems[1].querySelectorAll('button')).find(
      (b) => b.textContent === 'Tugaskan Semua'
    );
    secondItemBtn.click();
    expect(state.assignAll).toHaveBeenCalledWith('item-2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tombol hapus item
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — tombol hapus item', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('setiap item memiliki tombol hapus (.btn-remove)', () => {
    const state = createMockState({
      items: [createMockItem()],
    });
    renderBillPanel(state, container);
    const deleteBtn = container.querySelector('.btn-remove');
    expect(deleteBtn).not.toBeNull();
  });

  it('tombol hapus memiliki aria-label yang menyebutkan nama item', () => {
    const state = createMockState({
      items: [createMockItem({ name: 'Nasi Goreng' })],
    });
    renderBillPanel(state, container);
    const deleteBtn = container.querySelector('.btn-remove');
    expect(deleteBtn.getAttribute('aria-label')).toContain('Nasi Goreng');
  });

  it('klik tombol hapus memanggil state.removeItem dengan id yang benar', () => {
    const state = createMockState({
      items: [createMockItem({ id: 'item-1' })],
    });
    renderBillPanel(state, container);
    const deleteBtn = container.querySelector('.btn-remove');
    deleteBtn.click();
    expect(state.removeItem).toHaveBeenCalledWith('item-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Re-render
// ─────────────────────────────────────────────────────────────────────────────

describe('renderBillPanel — re-render', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('re-render menampilkan daftar item terbaru', () => {
    const state = createMockState({
      items: [createMockItem({ id: 'item-1' })],
    });
    renderBillPanel(state, container);
    expect(container.querySelectorAll('.bill-item').length).toBe(1);

    state.items = [
      createMockItem({ id: 'item-1' }),
      createMockItem({ id: 'item-2', name: 'Es Teh', price: 5000 }),
    ];
    renderBillPanel(state, container);
    expect(container.querySelectorAll('.bill-item').length).toBe(2);
  });

  it('re-render tidak menduplikasi form', () => {
    const state = createMockState();
    renderBillPanel(state, container);
    renderBillPanel(state, container);
    const forms = container.querySelectorAll('form');
    expect(forms.length).toBe(1);
  });

  it('re-render memperbarui subtotal', () => {
    const state = createMockState({ items: [] });
    renderBillPanel(state, container);
    expect(container.querySelector('.subtotal-value').textContent).toBe('0,00');

    state.items = [createMockItem({ price: 50000 })];
    renderBillPanel(state, container);
    expect(container.querySelector('.subtotal-value').textContent).toBe('50.000,00');
  });
});
