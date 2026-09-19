// app.js — entry point: wires state → render → drag-drop → reset button
//
// Alur data unidirectional:
//   User Action → Event Handler → State Mutation → render(state)
//
// Tanggung jawab modul ini:
//   1. Inisialisasi AppState
//   2. Subscribe render ke perubahan state
//   3. Pasang event listener tombol reset (dengan konfirmasi)
//   4. Panggil dragDropController.init setelah setiap render
//   5. Render awal

import AppState from './state.js';
import { render } from './render.js';
import { init as dragDropInit } from './dragdrop.js';

// ── Fungsi render yang juga menginisialisasi ulang drag & drop ────────────────

/**
 * Render UI dan re-attach event listener drag & drop.
 *
 * Karena render() mengganti DOM secara penuh (stateless render), event listener
 * drag & drop harus di-attach ulang setelah setiap render.
 *
 * @param {typeof AppState} state - State aplikasi saat ini
 */
function renderAndInitDragDrop(state) {
  render(state);
  // Panggil init setelah render agar event listener di-attach ke elemen DOM baru
  dragDropInit(state, (itemId, participantId) => AppState.assignParticipant(itemId, participantId));
}

// ── Subscribe render ke perubahan state ──────────────────────────────────────

// Setiap kali state berubah (mutasi apapun), render ulang seluruh UI
AppState.subscribe(() => renderAndInitDragDrop(AppState));

// ── Event listener tombol reset ───────────────────────────────────────────────

// Tombol reset ada di header dengan id "btn-reset" (lihat index.html)
const resetBtn = document.getElementById('btn-reset');

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    // Tampilkan konfirmasi sebelum menghapus semua data (Req 6.2)
    const dikonfirmasi = window.confirm(
      'Apakah Anda yakin ingin mereset semua data?\n' +
      'Semua peserta, item, pajak, dan tip akan dihapus.'
    );

    if (dikonfirmasi) {
      // Hapus semua data dan kembalikan ke kondisi awal (Req 6.3)
      AppState.reset();
    }
  });
}

// ── Render awal ───────────────────────────────────────────────────────────────

// Render pertama kali saat aplikasi dimuat
renderAndInitDragDrop(AppState);
