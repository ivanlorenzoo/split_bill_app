// validation.js — input validation utilities: participant names, item names/prices, tax/tip rates

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string}  [error] - Pesan error jika valid = false
 */

/**
 * Validasi nama participant baru.
 * Menolak string kosong/whitespace-only dan nama duplikat (case-insensitive, trimmed).
 *
 * @param {string} name - Nama yang akan divalidasi
 * @param {string[]} existingNames - Daftar nama participant yang sudah ada
 * @returns {ValidationResult}
 */
export function validateParticipantName(name, existingNames = []) {
  if (typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'Nama peserta tidak boleh kosong' };
  }

  const trimmed = name.trim().toLowerCase();
  const isDuplicate = existingNames.some(
    (existing) => existing.trim().toLowerCase() === trimmed
  );

  if (isDuplicate) {
    return {
      valid: false,
      error: `Peserta '${name.trim()}' sudah ada dalam daftar`,
    };
  }

  return { valid: true };
}

/**
 * Validasi nama item tagihan.
 * Menolak string kosong atau whitespace-only.
 *
 * @param {string} name - Nama item yang akan divalidasi
 * @returns {ValidationResult}
 */
export function validateItemName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'Nama item tidak boleh kosong' };
  }

  return { valid: true };
}

/**
 * Validasi harga item tagihan.
 * Menolak nilai non-positif: 0, negatif, NaN, string (semua bentuk), undefined, null.
 * Hanya menerima nilai bertipe number yang positif dan bukan NaN.
 *
 * @param {*} price - Nilai harga yang akan divalidasi
 * @returns {ValidationResult}
 */
export function validateItemPrice(price) {
  if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
    return { valid: false, error: 'Harga harus berupa angka lebih dari 0' };
  }

  return { valid: true };
}

/**
 * Validasi nilai persentase tax atau tip.
 * Menolak nilai negatif, NaN, dan string non-numerik.
 * Menerima 0 dan angka positif.
 *
 * @param {*} rate - Nilai rate yang akan divalidasi
 * @returns {ValidationResult}
 */
export function validateRate(rate) {
  if (rate === undefined || rate === null || rate === '') {
    return { valid: false, error: 'Nilai harus berupa angka 0 atau lebih' };
  }

  if (typeof rate === 'string' && rate.trim() === '') {
    return { valid: false, error: 'Nilai harus berupa angka 0 atau lebih' };
  }

  const num = Number(rate);

  if (Number.isNaN(num) || num < 0) {
    return { valid: false, error: 'Nilai harus berupa angka 0 atau lebih' };
  }

  return { valid: true };
}
