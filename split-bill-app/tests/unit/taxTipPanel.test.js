// Unit tests untuk taxTipPanel.js
// Requirements: 4.1, 4.2, 4.3, 4.4

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTaxTipPanel } from '../../components/taxTipPanel.js';

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
    setTaxRate: vi.fn(),
    setTipRate: vi.fn(),
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
    price: 100000,
    assignedTo: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Render dasar
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — render dasar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender tanpa error dengan state kosong', () => {
    const state = createMockState();
    expect(() => renderTaxTipPanel(state, container)).not.toThrow();
  });

  it('mengosongkan container sebelum render ulang', () => {
    const state = createMockState();
    container.innerHTML = '<p>konten lama</p>';
    renderTaxTipPanel(state, container);
    expect(container.querySelector('p')?.textContent).not.toBe('konten lama');
  });

  it('merender judul panel "Pajak & Tip"', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const title = container.querySelector('.panel-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Pajak & Tip');
  });

  it('merender dua baris input (tax dan tip)', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const rows = container.querySelectorAll('.tax-tip-row');
    expect(rows.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Input pajak — Req 4.1
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — input pajak (Req 4.1)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender label "Pajak" — Req 4.1', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const labels = container.querySelectorAll('.tax-tip-label');
    const pajakLabel = Array.from(labels).find((l) => l.textContent === 'Pajak');
    expect(pajakLabel).not.toBeNull();
  });

  it('merender input number dengan id "tax-rate-input" — Req 4.1', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    expect(input).not.toBeNull();
    expect(input.type).toBe('number');
  });

  it('merender simbol "%" di baris pajak — Req 4.1', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const symbols = container.querySelectorAll('.tax-tip-symbol');
    expect(symbols.length).toBeGreaterThanOrEqual(1);
    const hasPercent = Array.from(symbols).some((s) => s.textContent === '%');
    expect(hasPercent).toBe(true);
  });

  it('merender tampilan nilai mata uang pajak dengan id "tax-amount-display" — Req 4.1', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tax-amount-display');
    expect(display).not.toBeNull();
  });

  it('label pajak terhubung ke input melalui htmlFor — Req 4.1', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const label = Array.from(container.querySelectorAll('label')).find(
      (l) => l.textContent === 'Pajak'
    );
    expect(label).not.toBeNull();
    expect(label.htmlFor).toBe('tax-rate-input');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Input tip — Req 4.2
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — input tip (Req 4.2)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender label "Tip" — Req 4.2', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const labels = container.querySelectorAll('.tax-tip-label');
    const tipLabel = Array.from(labels).find((l) => l.textContent === 'Tip');
    expect(tipLabel).not.toBeNull();
  });

  it('merender input number dengan id "tip-rate-input" — Req 4.2', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    expect(input).not.toBeNull();
    expect(input.type).toBe('number');
  });

  it('merender simbol "%" di baris tip — Req 4.2', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const symbols = container.querySelectorAll('.tax-tip-symbol');
    expect(symbols.length).toBe(2);
  });

  it('merender tampilan nilai mata uang tip dengan id "tip-amount-display" — Req 4.2', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tip-amount-display');
    expect(display).not.toBeNull();
  });

  it('label tip terhubung ke input melalui htmlFor — Req 4.2', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const label = Array.from(container.querySelectorAll('label')).find(
      (l) => l.textContent === 'Tip'
    );
    expect(label).not.toBeNull();
    expect(label.htmlFor).toBe('tip-rate-input');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nilai 0 — Req 4.1, 4.2
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — nilai 0 (Req 4.1, 4.2)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('tax amount display menampilkan "0,00" saat taxRate=0 — Req 4.1', () => {
    const state = createMockState({ taxRate: 0 });
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tax-amount-display');
    expect(display.textContent).toBe('0,00');
  });

  it('tip amount display menampilkan "0,00" saat tipRate=0 — Req 4.2', () => {
    const state = createMockState({ tipRate: 0 });
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tip-amount-display');
    expect(display.textContent).toBe('0,00');
  });

  it('tax input memiliki nilai 0 saat taxRate=0 — Req 4.1', () => {
    const state = createMockState({ taxRate: 0 });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    expect(Number(input.value)).toBe(0);
  });

  it('tip input memiliki nilai 0 saat tipRate=0 — Req 4.2', () => {
    const state = createMockState({ tipRate: 0 });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    expect(Number(input.value)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nilai valid — Req 4.3
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — nilai valid (Req 4.3)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('tax amount display menampilkan nilai yang benar saat taxRate=10 dan subtotal=100000 — Req 4.3', () => {
    const state = createMockState({
      taxRate: 10,
      items: [createMockItem({ price: 100000 })],
    });
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tax-amount-display');
    // 10% dari 100000 = 10000 → "10.000,00"
    expect(display.textContent).toBe('10.000,00');
  });

  it('tip amount display menampilkan nilai yang benar saat tipRate=5 dan subtotal=100000 — Req 4.3', () => {
    const state = createMockState({
      tipRate: 5,
      items: [createMockItem({ price: 100000 })],
    });
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tip-amount-display');
    // 5% dari 100000 = 5000 → "5.000,00"
    expect(display.textContent).toBe('5.000,00');
  });

  it('tax input menampilkan nilai taxRate yang ada di state — Req 4.3', () => {
    const state = createMockState({ taxRate: 10 });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    expect(Number(input.value)).toBe(10);
  });

  it('tip input menampilkan nilai tipRate yang ada di state — Req 4.3', () => {
    const state = createMockState({ tipRate: 5 });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    expect(Number(input.value)).toBe(5);
  });

  it('tax amount display menampilkan "0,00" saat items kosong meskipun taxRate > 0 — Req 4.3', () => {
    const state = createMockState({ taxRate: 10, items: [] });
    renderTaxTipPanel(state, container);
    const display = container.querySelector('#tax-amount-display');
    expect(display.textContent).toBe('0,00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nilai invalid — Req 4.4
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — nilai invalid (Req 4.4)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('input negatif pada tax menampilkan pesan error — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '-5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const errorEl = container.querySelector('#tax-rate-error');
    expect(errorEl.textContent).toBe('Nilai harus berupa angka 0 atau lebih');
  });

  it('input negatif pada tax menambahkan class "visible" ke error element — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '-1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const errorEl = container.querySelector('#tax-rate-error');
    expect(errorEl.classList.contains('visible')).toBe(true);
  });

  it('input negatif pada tax menambahkan class "error" ke input — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '-1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.classList.contains('error')).toBe(true);
  });

  it('input negatif pada tax memanggil setTaxRate(0) — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '-5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.setTaxRate).toHaveBeenCalledWith(0);
  });

  it('input kosong pada tax menampilkan pesan error — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const errorEl = container.querySelector('#tax-rate-error');
    expect(errorEl.textContent).toBe('Nilai harus berupa angka 0 atau lebih');
    expect(errorEl.classList.contains('visible')).toBe(true);
  });

  it('input negatif pada tip menampilkan pesan error — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const errorEl = container.querySelector('#tip-rate-error');
    expect(errorEl.textContent).toBe('Nilai harus berupa angka 0 atau lebih');
  });

  it('input negatif pada tip menambahkan class "visible" ke error element — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const errorEl = container.querySelector('#tip-rate-error');
    expect(errorEl.classList.contains('visible')).toBe(true);
  });

  it('input negatif pada tip menambahkan class "error" ke input — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.classList.contains('error')).toBe(true);
  });

  it('input negatif pada tip memanggil setTipRate(0) — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.setTipRate).toHaveBeenCalledWith(0);
  });

  it('input kosong pada tip menampilkan pesan error — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const errorEl = container.querySelector('#tip-rate-error');
    expect(errorEl.classList.contains('visible')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nilai valid setelah invalid — Req 4.4
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — nilai valid setelah invalid (Req 4.4)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('input valid pada tax menghapus pesan error dan class "visible" — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    const errorEl = container.querySelector('#tax-rate-error');

    // Pertama masukkan nilai invalid
    input.value = '-1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(errorEl.classList.contains('visible')).toBe(true);

    // Kemudian masukkan nilai valid
    input.value = '10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(errorEl.classList.contains('visible')).toBe(false);
    expect(errorEl.textContent).toBe('');
  });

  it('input valid pada tax menghapus class "error" dari input — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');

    input.value = '-1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.classList.contains('error')).toBe(true);

    input.value = '10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.classList.contains('error')).toBe(false);
  });

  it('input valid pada tip menghapus pesan error dan class "visible" — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    const errorEl = container.querySelector('#tip-rate-error');

    input.value = '-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(errorEl.classList.contains('visible')).toBe(true);

    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(errorEl.classList.contains('visible')).toBe(false);
    expect(errorEl.textContent).toBe('');
  });

  it('input valid pada tip menghapus class "error" dari input — Req 4.4', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');

    input.value = '-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.classList.contains('error')).toBe(true);

    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.classList.contains('error')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Commit ke state — Req 4.3
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — commit ke state (Req 4.3)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('input valid pada tax memanggil setTaxRate dengan nilai angka yang benar — Req 4.3', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.setTaxRate).toHaveBeenCalledWith(10);
  });

  it('input valid pada tip memanggil setTipRate dengan nilai angka yang benar — Req 4.3', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.setTipRate).toHaveBeenCalledWith(5);
  });

  it('input 0 pada tax memanggil setTaxRate(0) — Req 4.3', () => {
    const state = createMockState({ taxRate: 10 });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.setTaxRate).toHaveBeenCalledWith(0);
  });

  it('input 0 pada tip memanggil setTipRate(0) — Req 4.3', () => {
    const state = createMockState({ tipRate: 5 });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.setTipRate).toHaveBeenCalledWith(0);
  });

  it('input valid pada tax memperbarui tax amount display — Req 4.3', () => {
    const state = createMockState({
      items: [createMockItem({ price: 100000 })],
    });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    input.value = '10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const display = container.querySelector('#tax-amount-display');
    expect(display.textContent).toBe('10.000,00');
  });

  it('input valid pada tip memperbarui tip amount display — Req 4.3', () => {
    const state = createMockState({
      items: [createMockItem({ price: 100000 })],
    });
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const display = container.querySelector('#tip-amount-display');
    expect(display.textContent).toBe('5.000,00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Aksesibilitas
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — aksesibilitas', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('tax input memiliki aria-label', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tax-rate-input');
    expect(input.getAttribute('aria-label')).toBeTruthy();
  });

  it('tip input memiliki aria-label', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const input = container.querySelector('#tip-rate-input');
    expect(input.getAttribute('aria-label')).toBeTruthy();
  });

  it('tax error element memiliki role="alert"', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const errorEl = container.querySelector('#tax-rate-error');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute('role')).toBe('alert');
  });

  it('tax error element memiliki aria-live="polite"', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const errorEl = container.querySelector('#tax-rate-error');
    expect(errorEl.getAttribute('aria-live')).toBe('polite');
  });

  it('tip error element memiliki role="alert"', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const errorEl = container.querySelector('#tip-rate-error');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute('role')).toBe('alert');
  });

  it('tip error element memiliki aria-live="polite"', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const errorEl = container.querySelector('#tip-rate-error');
    expect(errorEl.getAttribute('aria-live')).toBe('polite');
  });

  it('label pajak terhubung ke input tax melalui atribut for', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const label = Array.from(container.querySelectorAll('label')).find(
      (l) => l.textContent === 'Pajak'
    );
    const input = container.querySelector(`#${label.htmlFor}`);
    expect(input).not.toBeNull();
    expect(input.id).toBe('tax-rate-input');
  });

  it('label tip terhubung ke input tip melalui atribut for', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    const label = Array.from(container.querySelectorAll('label')).find(
      (l) => l.textContent === 'Tip'
    );
    const input = container.querySelector(`#${label.htmlFor}`);
    expect(input).not.toBeNull();
    expect(input.id).toBe('tip-rate-input');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Re-render
// ─────────────────────────────────────────────────────────────────────────────

describe('renderTaxTipPanel — re-render', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('re-render mencerminkan taxRate terbaru dari state', () => {
    const state = createMockState({ taxRate: 0 });
    renderTaxTipPanel(state, container);
    expect(Number(container.querySelector('#tax-rate-input').value)).toBe(0);

    state.taxRate = 15;
    renderTaxTipPanel(state, container);
    expect(Number(container.querySelector('#tax-rate-input').value)).toBe(15);
  });

  it('re-render mencerminkan tipRate terbaru dari state', () => {
    const state = createMockState({ tipRate: 0 });
    renderTaxTipPanel(state, container);
    expect(Number(container.querySelector('#tip-rate-input').value)).toBe(0);

    state.tipRate = 10;
    renderTaxTipPanel(state, container);
    expect(Number(container.querySelector('#tip-rate-input').value)).toBe(10);
  });

  it('re-render tidak menduplikasi judul panel', () => {
    const state = createMockState();
    renderTaxTipPanel(state, container);
    renderTaxTipPanel(state, container);
    const titles = container.querySelectorAll('.panel-title');
    expect(titles.length).toBe(1);
  });

  it('re-render memperbarui tax amount display sesuai items terbaru', () => {
    const state = createMockState({ taxRate: 10, items: [] });
    renderTaxTipPanel(state, container);
    expect(container.querySelector('#tax-amount-display').textContent).toBe('0,00');

    state.items = [createMockItem({ price: 100000 })];
    renderTaxTipPanel(state, container);
    expect(container.querySelector('#tax-amount-display').textContent).toBe('10.000,00');
  });
});
