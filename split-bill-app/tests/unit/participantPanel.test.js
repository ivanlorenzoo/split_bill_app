// Unit tests untuk participantPanel.js
// Requirements: 1.1, 1.2, 1.3, 1.4

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderParticipantPanel } from '../../components/participantPanel.js';

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
    addParticipant: vi.fn(() => ({ success: true })),
    removeParticipant: vi.fn(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Render dasar
// ─────────────────────────────────────────────────────────────────────────────

describe('renderParticipantPanel — render dasar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('merender tanpa error dengan state kosong — Req 1.1', () => {
    const state = createMockState();
    expect(() => renderParticipantPanel(state, container)).not.toThrow();
  });

  it('mengosongkan container sebelum render ulang', () => {
    const state = createMockState();
    container.innerHTML = '<p>konten lama</p>';
    renderParticipantPanel(state, container);
    expect(container.querySelector('p')?.textContent).not.toBe('konten lama');
  });

  it('merender form tambah peserta — Req 1.1', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
  });

  it('form memiliki input teks untuk nama peserta — Req 1.1', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const input = container.querySelector('input[type="text"]');
    expect(input).not.toBeNull();
  });

  it('input memiliki placeholder "Nama peserta" — Req 1.1', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const input = container.querySelector('input[type="text"]');
    expect(input.placeholder).toBe('Nama peserta');
  });

  it('form memiliki tombol submit "Tambah" — Req 1.1', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Tambah');
  });

  it('merender daftar peserta (ul.participant-list) — Req 1.2', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const list = container.querySelector('.participant-list');
    expect(list).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Render daftar peserta
// ─────────────────────────────────────────────────────────────────────────────

describe('renderParticipantPanel — daftar peserta', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('menampilkan pesan kosong jika tidak ada peserta', () => {
    const state = createMockState({ participants: [] });
    renderParticipantPanel(state, container);
    const empty = container.querySelector('.empty-state');
    expect(empty).not.toBeNull();
  });

  it('merender kartu untuk setiap peserta — Req 1.2', () => {
    const state = createMockState({
      participants: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
    });
    renderParticipantPanel(state, container);
    const cards = container.querySelectorAll('.participant-card');
    expect(cards.length).toBe(2);
  });

  it('setiap kartu menampilkan nama peserta — Req 1.2', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const nameEl = container.querySelector('.participant-name');
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toBe('Alice');
  });

  it('setiap kartu memiliki atribut data-participant-id — Req 1.2', () => {
    const state = createMockState({
      participants: [{ id: 'abc-123', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const card = container.querySelector('.participant-card');
    expect(card.getAttribute('data-participant-id')).toBe('abc-123');
  });

  it('setiap kartu memiliki atribut draggable="true" — Req 1.2', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const card = container.querySelector('.participant-card');
    expect(card.getAttribute('draggable')).toBe('true');
  });

  it('setiap kartu memiliki tombol hapus — Req 1.5', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const deleteBtn = container.querySelector('.btn-remove');
    expect(deleteBtn).not.toBeNull();
  });

  it('tombol hapus memiliki aria-label yang menyebutkan nama peserta — Req 1.5', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const deleteBtn = container.querySelector('.btn-remove');
    expect(deleteBtn.getAttribute('aria-label')).toContain('Alice');
  });

  it('klik tombol hapus memanggil state.removeParticipant dengan id yang benar — Req 1.5', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const deleteBtn = container.querySelector('.btn-remove');
    deleteBtn.click();
    expect(state.removeParticipant).toHaveBeenCalledWith('p1');
  });

  it('merender beberapa peserta dengan id yang berbeda', () => {
    const state = createMockState({
      participants: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Carol' },
      ],
    });
    renderParticipantPanel(state, container);
    const cards = container.querySelectorAll('[data-participant-id]');
    const ids = Array.from(cards).map((c) => c.getAttribute('data-participant-id'));
    expect(ids).toEqual(['p1', 'p2', 'p3']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Form submit — tambah peserta berhasil
// ─────────────────────────────────────────────────────────────────────────────

describe('renderParticipantPanel — form submit berhasil', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('memanggil state.addParticipant dengan nilai input saat form disubmit — Req 1.1', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    input.value = 'Alice';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(state.addParticipant).toHaveBeenCalledWith('Alice');
  });

  it('mengosongkan input setelah submit berhasil — Req 1.1', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({ success: true })),
    });
    renderParticipantPanel(state, container);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');

    input.value = 'Alice';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(input.value).toBe('');
  });

  it('tidak menampilkan error setelah submit berhasil', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({ success: true })),
    });
    renderParticipantPanel(state, container);

    const input = container.querySelector('input[type="text"]');
    const form = container.querySelector('form');
    const errorEl = container.querySelector('[role="alert"]');

    input.value = 'Alice';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(errorEl.classList.contains('visible')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Form submit — validasi gagal (error inline)
// ─────────────────────────────────────────────────────────────────────────────

describe('renderParticipantPanel — tampilan error validasi', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('menampilkan pesan error jika addParticipant mengembalikan success=false — Req 1.3', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({
        success: false,
        error: 'Nama peserta tidak boleh kosong',
      })),
    });
    renderParticipantPanel(state, container);

    const form = container.querySelector('form');
    const input = container.querySelector('input[type="text"]');
    input.value = '   ';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const errorEl = container.querySelector('[role="alert"]');
    expect(errorEl.classList.contains('visible')).toBe(true);
    expect(errorEl.textContent).toBe('Nama peserta tidak boleh kosong');
  });

  it('menampilkan pesan error duplikat — Req 1.4', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({
        success: false,
        error: "Peserta 'Alice' sudah ada dalam daftar",
      })),
    });
    renderParticipantPanel(state, container);

    const form = container.querySelector('form');
    const input = container.querySelector('input[type="text"]');
    input.value = 'Alice';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const errorEl = container.querySelector('[role="alert"]');
    expect(errorEl.classList.contains('visible')).toBe(true);
    expect(errorEl.textContent).toContain('Alice');
  });

  it('input mendapat class "error" saat validasi gagal — Req 1.3', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({
        success: false,
        error: 'Nama peserta tidak boleh kosong',
      })),
    });
    renderParticipantPanel(state, container);

    const form = container.querySelector('form');
    const input = container.querySelector('input[type="text"]');
    input.value = '';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(input.classList.contains('error')).toBe(true);
  });

  it('error hilang saat user mulai mengetik ulang', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({
        success: false,
        error: 'Nama peserta tidak boleh kosong',
      })),
    });
    renderParticipantPanel(state, container);

    const form = container.querySelector('form');
    const input = container.querySelector('input[type="text"]');
    input.value = '';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Pastikan error muncul dulu
    const errorEl = container.querySelector('[role="alert"]');
    expect(errorEl.classList.contains('visible')).toBe(true);

    // Simulasi user mengetik
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(errorEl.classList.contains('visible')).toBe(false);
    expect(input.classList.contains('error')).toBe(false);
  });

  it('tidak mengosongkan input saat validasi gagal', () => {
    const state = createMockState({
      addParticipant: vi.fn(() => ({
        success: false,
        error: 'Nama peserta tidak boleh kosong',
      })),
    });
    renderParticipantPanel(state, container);

    const form = container.querySelector('form');
    const input = container.querySelector('input[type="text"]');
    input.value = '   ';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Input tidak dikosongkan agar user bisa memperbaiki
    expect(input.value).toBe('   ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Aksesibilitas
// ─────────────────────────────────────────────────────────────────────────────

describe('renderParticipantPanel — aksesibilitas', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('input memiliki elemen <label> yang terhubung — Req 7.3', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const input = container.querySelector('input[type="text"]');
    const label = container.querySelector(`label[for="${input.id}"]`);
    expect(label).not.toBeNull();
  });

  it('input memiliki aria-label — Req 7.3', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const input = container.querySelector('input[type="text"]');
    expect(input.getAttribute('aria-label')).toBeTruthy();
  });

  it('area error memiliki role="alert" atau aria-live — Req 7.3', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const errorEl = container.querySelector('[role="alert"]');
    expect(errorEl).not.toBeNull();
  });

  it('tombol submit memiliki aria-label — Req 7.3', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    const btn = container.querySelector('button[type="submit"]');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('kartu peserta memiliki aria-label yang deskriptif — Req 7.3', () => {
    const state = createMockState({
      participants: [{ id: 'p1', name: 'Alice' }],
    });
    renderParticipantPanel(state, container);
    const card = container.querySelector('.participant-card');
    expect(card.getAttribute('aria-label')).toContain('Alice');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Re-render
// ─────────────────────────────────────────────────────────────────────────────

describe('renderParticipantPanel — re-render', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('re-render menampilkan daftar peserta terbaru', () => {
    const state = createMockState({ participants: [{ id: 'p1', name: 'Alice' }] });
    renderParticipantPanel(state, container);
    expect(container.querySelectorAll('.participant-card').length).toBe(1);

    // Simulasi state berubah (peserta baru ditambahkan)
    state.participants = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];
    renderParticipantPanel(state, container);
    expect(container.querySelectorAll('.participant-card').length).toBe(2);
  });

  it('re-render tidak menduplikasi form', () => {
    const state = createMockState();
    renderParticipantPanel(state, container);
    renderParticipantPanel(state, container);
    const forms = container.querySelectorAll('form');
    expect(forms.length).toBe(1);
  });
});
