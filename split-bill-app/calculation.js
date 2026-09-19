// calculation.js — pure functions: subtotal, tax/tip, per-participant shares, Largest Remainder

/**
 * Menghitung total harga semua item (subtotal sebelum pajak dan tip).
 * Mengembalikan 0 jika array kosong.
 *
 * @param {import('./state.js').BillItem[]} items - Daftar item tagihan
 * @returns {number} Subtotal
 */
export function calculateSubtotal(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
}

/**
 * Menghitung nilai pajak dalam mata uang berdasarkan (subtotal + tipAmount) dan tax rate.
 * Tip dihitung terlebih dahulu, kemudian pajak dikenakan atas (subtotal + tip).
 * Mengembalikan 0 jika subtotal = 0.
 *
 * @param {number} subtotalPlusTip - Total harga setelah tip (subtotal + tipAmount)
 * @param {number} taxRate         - Persentase pajak (0–100)
 * @returns {number} Nilai pajak
 */
export function calculateTaxAmount(subtotalPlusTip, taxRate) {
  if (!subtotalPlusTip || subtotalPlusTip === 0) return 0;
  return subtotalPlusTip * taxRate / 100;
}

/**
 * Menghitung nilai tip dalam mata uang berdasarkan subtotal dan tip rate.
 * Mengembalikan 0 jika subtotal = 0.
 *
 * @param {number} subtotal - Total harga sebelum tip
 * @param {number} tipRate  - Persentase tip (0–100)
 * @returns {number} Nilai tip
 */
export function calculateTipAmount(subtotal, tipRate) {
  if (!subtotal || subtotal === 0) return 0;
  return subtotal * tipRate / 100;
}

/**
 * Menghitung share seorang participant berdasarkan item yang di-assign kepadanya,
 * serta porsi proporsional dari pajak dan tip.
 *
 * @param {import('./state.js').Participant} participant
 * @param {import('./state.js').BillItem[]} items
 * @param {number} subtotal   - Total subtotal semua item
 * @param {number} taxAmount  - Nilai pajak total
 * @param {number} tipAmount  - Nilai tip total
 * @returns {import('./state.js').ParticipantShare} Share participant (rawTotal sebelum Largest Remainder)
 */
export function calculateParticipantShare(participant, items, subtotal, taxAmount, tipAmount) {
  // Kumpulkan item yang di-assign ke participant ini
  const assignedItems = items.filter(
    (item) => Array.isArray(item.assignedTo) && item.assignedTo.includes(participant.id)
  );

  // Hitung itemsSubtotal: setiap item dibagi rata di antara semua participant yang di-assign
  let itemsSubtotal = 0;
  const itemDetails = [];

  for (const item of assignedItems) {
    const assigneeCount = item.assignedTo.length;
    const share = assigneeCount > 0 ? item.price / assigneeCount : 0;
    itemsSubtotal += share;
    itemDetails.push({
      itemId: item.id,
      name: item.name,
      share,
    });
  }

  // Hitung porsi proporsional pajak dan tip
  let taxShare = 0;
  let tipShare = 0;

  if (subtotal > 0) {
    taxShare = (itemsSubtotal / subtotal) * taxAmount;
    tipShare = (itemsSubtotal / subtotal) * tipAmount;
  }

  const rawTotal = itemsSubtotal + taxShare + tipShare;

  return {
    participantId: participant.id,
    name: participant.name,
    itemsSubtotal,
    taxShare,
    tipShare,
    rawTotal,
    total: rawTotal, // akan diperbarui oleh distributeRemainder
    items: itemDetails,
  };
}

/**
 * Mendistribusikan sisa pembulatan menggunakan Largest Remainder Method.
 * Memastikan sum(shares.total) === totalBill (presisi 2 desimal).
 *
 * @param {import('./state.js').ParticipantShare[]} shares - Array share participant (dengan rawTotal)
 * @param {number} totalBill - Total tagihan yang harus terpenuhi
 * @returns {import('./state.js').ParticipantShare[]} Shares dengan total yang sudah dibulatkan
 */
export function distributeRemainder(shares, totalBill) {
  if (!shares || shares.length === 0) return [];

  const CENTS = 100; // faktor untuk konversi ke sen (2 desimal)

  // Floor setiap share ke 2 desimal
  const floored = shares.map((s) => {
    const flooredTotal = Math.floor(s.rawTotal * CENTS) / CENTS;
    return {
      ...s,
      total: flooredTotal,
      _fractional: s.rawTotal * CENTS - Math.floor(s.rawTotal * CENTS),
    };
  });

  // Hitung sisa yang perlu didistribusikan (dalam sen)
  const sumFloored = floored.reduce((sum, s) => sum + s.total, 0);
  const totalBillRounded = Math.round(totalBill * CENTS) / CENTS;
  let remainderCents = Math.round((totalBillRounded - sumFloored) * CENTS);

  // Urutkan berdasarkan fractional part terbesar (descending) untuk distribusi
  const sorted = floored
    .map((s, idx) => ({ ...s, _originalIdx: idx }))
    .sort((a, b) => b._fractional - a._fractional);

  // Distribusikan 0.01 ke participant dengan fractional part terbesar
  for (let i = 0; i < sorted.length && remainderCents > 0; i++) {
    sorted[i].total = Math.round((sorted[i].total + 0.01) * CENTS) / CENTS;
    remainderCents--;
  }

  // Kembalikan ke urutan semula, bersihkan field internal
  const result = new Array(floored.length);
  for (const s of sorted) {
    const { _fractional, _originalIdx, ...clean } = s;
    result[_originalIdx] = clean;
  }

  return result;
}

/**
 * Mengorkestrasi semua fungsi kalkulasi dan mengembalikan Summary lengkap.
 *
 * @param {{ participants: import('./state.js').Participant[], items: import('./state.js').BillItem[], taxRate: number, tipRate: number }} state
 * @returns {import('./state.js').Summary}
 */
export function calculateSummary(state) {
  const { participants = [], items = [], taxRate = 0, tipRate = 0 } = state;

  const subtotal = calculateSubtotal(items);
  const tipAmount = calculateTipAmount(subtotal, tipRate);
  const taxAmount = calculateTaxAmount(subtotal + tipAmount, taxRate);
  const totalBill = Math.round((subtotal + tipAmount + taxAmount) * 100) / 100;

  // Identifikasi item yang belum ditugaskan ke siapapun
  const unassignedItems = items
    .filter((item) => !Array.isArray(item.assignedTo) || item.assignedTo.length === 0)
    .map((item) => item.id);

  // Hitung raw share untuk setiap participant
  const rawShares = participants.map((participant) =>
    calculateParticipantShare(participant, items, subtotal, taxAmount, tipAmount)
  );

  // Distribusikan sisa pembulatan agar sum(shares) === totalBill
  const participantShares = participants.length > 0
    ? distributeRemainder(rawShares, totalBill)
    : [];

  return {
    subtotal,
    taxAmount,
    tipAmount,
    totalBill,
    participantShares,
    unassignedItems,
  };
}
