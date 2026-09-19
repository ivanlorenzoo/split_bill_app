// state.js — AppState: centralized state object + observer pattern (subscribe/notify)

import {
  validateParticipantName,
  validateItemName,
  validateItemPrice,
  validateRate,
} from './validation.js';

/**
 * @typedef {Object} Participant
 * @property {string} id   - UUID unik
 * @property {string} name - Nama participant (trimmed, non-empty)
 */

/**
 * @typedef {Object} BillItem
 * @property {string}   id         - UUID unik
 * @property {string}   name       - Nama item (trimmed, non-empty)
 * @property {number}   price      - Harga item (angka positif)
 * @property {string[]} assignedTo - Array of Participant.id
 */

/**
 * @typedef {Object} ParticipantShare
 * @property {string}        participantId
 * @property {string}        name
 * @property {number}        itemsSubtotal
 * @property {number}        taxShare
 * @property {number}        tipShare
 * @property {number}        total
 * @property {ItemDetail[]}  items
 */

/**
 * @typedef {Object} ItemDetail
 * @property {string} itemId
 * @property {string} name
 * @property {number} share
 */

/**
 * @typedef {Object} Summary
 * @property {number}             subtotal
 * @property {number}             taxAmount
 * @property {number}             tipAmount
 * @property {number}             totalBill
 * @property {ParticipantShare[]} participantShares
 * @property {string[]}           unassignedItems
 */

/**
 * @typedef {Object} Result
 * @property {boolean} success
 * @property {string}  [error]
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Menghasilkan UUID v4 sederhana menggunakan crypto.randomUUID jika tersedia,
 * atau fallback ke implementasi manual.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: UUID v4 manual
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// State awal
// ---------------------------------------------------------------------------

/** @type {Participant[]} */
let participants = [];

/** @type {BillItem[]} */
let items = [];

/** @type {number} */
let taxRate = 0;

/** @type {number} */
let tipRate = 0;

/** @type {Array<() => void>} */
let listeners = [];

// ---------------------------------------------------------------------------
// Observer pattern
// ---------------------------------------------------------------------------

/**
 * Memanggil semua listener yang terdaftar.
 * @private
 */
function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.error('[AppState] Error in listener:', err);
    }
  }
}

/**
 * Mendaftarkan listener yang akan dipanggil setiap kali state berubah.
 * Mengembalikan fungsi unsubscribe untuk membatalkan pendaftaran.
 *
 * @param {() => void} listener
 * @returns {() => void} Fungsi unsubscribe
 */
function subscribe(listener) {
  listeners.push(listener);
  return function unsubscribe() {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// ---------------------------------------------------------------------------
// Mutasi Participant
// ---------------------------------------------------------------------------

/**
 * Menambahkan participant baru ke state.
 * Validasi: nama tidak boleh kosong/whitespace, tidak boleh duplikat, maks 20 peserta.
 *
 * @param {string} name
 * @returns {Result}
 */
function addParticipant(name) {
  if (participants.length >= 20) {
    return { success: false, error: 'Maksimal 20 peserta dalam satu sesi' };
  }

  const existingNames = participants.map((p) => p.name);
  const validation = validateParticipantName(name, existingNames);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const newParticipant = { id: generateId(), name: name.trim() };
  participants = [...participants, newParticipant];
  notify();

  return { success: true };
}

/**
 * Menghapus participant dari state dan membersihkan semua assignment-nya dari item.
 *
 * @param {string} id - ID participant yang akan dihapus
 * @returns {void}
 */
function removeParticipant(id) {
  participants = participants.filter((p) => p.id !== id);

  // Hapus id dari assignedTo semua item
  items = items.map((item) => ({
    ...item,
    assignedTo: item.assignedTo.filter((pid) => pid !== id),
  }));

  notify();
}

// ---------------------------------------------------------------------------
// Mutasi Item
// ---------------------------------------------------------------------------

/**
 * Menambahkan item tagihan baru ke state.
 * Validasi: nama tidak boleh kosong, harga harus positif.
 *
 * @param {string} name
 * @param {number} price
 * @returns {Result}
 */
function addItem(name, price) {
  const nameValidation = validateItemName(name);
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error };
  }

  const priceValidation = validateItemPrice(price);
  if (!priceValidation.valid) {
    return { success: false, error: priceValidation.error };
  }

  const newItem = {
    id: generateId(),
    name: name.trim(),
    price,
    assignedTo: [],
  };

  items = [...items, newItem];
  notify();

  return { success: true };
}

/**
 * Menghapus item dari state berdasarkan id.
 *
 * @param {string} id - ID item yang akan dihapus
 * @returns {void}
 */
function removeItem(id) {
  items = items.filter((item) => item.id !== id);
  notify();
}

/**
 * Memperbarui properti item yang ada.
 * Validasi: nama dan harga jika disertakan dalam changes.
 *
 * @param {string} id - ID item yang akan diperbarui
 * @param {Partial<BillItem>} changes - Perubahan yang akan diterapkan
 * @returns {Result}
 */
function updateItem(id, changes) {
  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    return { success: false, error: 'Item tidak ditemukan' };
  }

  // Validasi nama jika disertakan
  if (changes.name !== undefined) {
    const nameValidation = validateItemName(changes.name);
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error };
    }
  }

  // Validasi harga jika disertakan
  if (changes.price !== undefined) {
    const priceValidation = validateItemPrice(changes.price);
    if (!priceValidation.valid) {
      return { success: false, error: priceValidation.error };
    }
  }

  const updatedItem = {
    ...items[itemIndex],
    ...changes,
    // Pastikan nama selalu trimmed jika diubah
    ...(changes.name !== undefined ? { name: changes.name.trim() } : {}),
    // Jangan izinkan perubahan id
    id: items[itemIndex].id,
  };

  items = [
    ...items.slice(0, itemIndex),
    updatedItem,
    ...items.slice(itemIndex + 1),
  ];

  notify();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Mutasi Assignment
// ---------------------------------------------------------------------------

/**
 * Menugaskan participant ke item. Tidak melakukan apa-apa jika sudah di-assign.
 *
 * @param {string} itemId
 * @param {string} participantId
 * @returns {void}
 */
function assignParticipant(itemId, participantId) {
  items = items.map((item) => {
    if (item.id !== itemId) return item;
    if (item.assignedTo.includes(participantId)) return item;
    return { ...item, assignedTo: [...item.assignedTo, participantId] };
  });
  notify();
}

/**
 * Menghapus penugasan participant dari item.
 *
 * @param {string} itemId
 * @param {string} participantId
 * @returns {void}
 */
function removeAssignment(itemId, participantId) {
  items = items.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      assignedTo: item.assignedTo.filter((pid) => pid !== participantId),
    };
  });
  notify();
}

/**
 * Menugaskan semua participant yang ada ke sebuah item sekaligus.
 *
 * @param {string} itemId
 * @returns {void}
 */
function assignAll(itemId) {
  const allParticipantIds = participants.map((p) => p.id);
  items = items.map((item) => {
    if (item.id !== itemId) return item;
    return { ...item, assignedTo: [...allParticipantIds] };
  });
  notify();
}

// ---------------------------------------------------------------------------
// Mutasi Tax & Tip
// ---------------------------------------------------------------------------

/**
 * Mengatur tax rate. Jika nilai tidak valid, gunakan 0.
 *
 * @param {*} rate
 * @returns {Result}
 */
function setTaxRate(rate) {
  const validation = validateRate(rate);
  if (!validation.valid) {
    taxRate = 0;
    notify();
    return { success: false, error: validation.error };
  }
  taxRate = Number(rate);
  notify();
  return { success: true };
}

/**
 * Mengatur tip rate. Jika nilai tidak valid, gunakan 0.
 *
 * @param {*} rate
 * @returns {Result}
 */
function setTipRate(rate) {
  const validation = validateRate(rate);
  if (!validation.valid) {
    tipRate = 0;
    notify();
    return { success: false, error: validation.error };
  }
  tipRate = Number(rate);
  notify();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/**
 * Mengembalikan state ke kondisi awal.
 * @returns {void}
 */
function reset() {
  participants = [];
  items = [];
  taxRate = 0;
  tipRate = 0;
  notify();
}

// ---------------------------------------------------------------------------
// AppState — public API
// ---------------------------------------------------------------------------

/**
 * AppState adalah objek tunggal (singleton) yang menyimpan seluruh state aplikasi.
 * Semua mutasi dilakukan melalui method-method di bawah ini.
 * Setiap mutasi memanggil notify() untuk memberitahu semua listener.
 */
const AppState = {
  // Getter untuk membaca state (read-only snapshot)
  get participants() { return participants; },
  get items() { return items; },
  get taxRate() { return taxRate; },
  get tipRate() { return tipRate; },

  // Observer
  subscribe,

  // Mutasi participant
  addParticipant,
  removeParticipant,

  // Mutasi item
  addItem,
  removeItem,
  updateItem,

  // Mutasi assignment
  assignParticipant,
  removeAssignment,
  assignAll,

  // Mutasi tax & tip
  setTaxRate,
  setTipRate,

  // Reset
  reset,
};

export default AppState;
