// render.js — fungsi render utama yang memanggil semua komponen panel secara berurutan

import { calculateSummary } from './calculation.js';
import { renderParticipantPanel } from './components/participantPanel.js';
import { renderBillPanel } from './components/billPanel.js';
import { renderTaxTipPanel } from './components/taxTipPanel.js';
import { renderSummaryPanel } from './components/summaryPanel.js';

/**
 * Render seluruh UI aplikasi berdasarkan state saat ini.
 *
 * Fungsi ini dipanggil setiap kali state berubah (via `AppState.subscribe(render)`).
 * Setiap panel di-render ulang secara penuh (stateless render) — tidak ada diffing.
 *
 * Urutan render:
 * 1. ParticipantPanel  — daftar peserta + form tambah peserta (#participant-panel)
 * 2. BillPanel         — daftar item tagihan + form tambah item + subtotal (#bill-panel)
 * 3. TaxTipPanel       — input persentase pajak dan tip (sub-container di dalam #bill-panel)
 * 4. SummaryPanel      — ringkasan total per peserta (#summary-panel)
 *
 * TaxTipPanel di-render ke dalam sub-container `#tax-tip-panel` yang dibuat secara
 * dinamis di dalam `#bill-panel` setelah BillPanel selesai di-render.
 *
 * @param {import('./state.js').AppState} state - State aplikasi saat ini
 */
export function render(state) {
  // ── Ambil container masing-masing panel dari DOM ──────────────────────────
  const participantContainer = document.getElementById('participant-panel');
  const billContainer = document.getElementById('bill-panel');
  const summaryContainer = document.getElementById('summary-panel');

  // Hitung summary dari state saat ini (pure function, tidak ada side effect)
  const summary = calculateSummary(state);

  // ── 1. Render ParticipantPanel ────────────────────────────────────────────
  if (participantContainer) {
    renderParticipantPanel(state, participantContainer);
  }

  // ── 2. Render BillPanel ───────────────────────────────────────────────────
  if (billContainer) {
    renderBillPanel(state, billContainer);

    // ── 3. Render TaxTipPanel (sub-container di dalam #bill-panel) ────────
    // BillPanel sudah mengisi billContainer; tambahkan sub-container untuk tax/tip
    // di bawah konten bill panel.
    let taxTipContainer = billContainer.querySelector('#tax-tip-panel');
    if (!taxTipContainer) {
      taxTipContainer = document.createElement('div');
      taxTipContainer.id = 'tax-tip-panel';
      billContainer.appendChild(taxTipContainer);
    }
    renderTaxTipPanel(state, taxTipContainer);
  }

  // ── 4. Render SummaryPanel ────────────────────────────────────────────────
  if (summaryContainer) {
    renderSummaryPanel(summary, summaryContainer);
  }
}
