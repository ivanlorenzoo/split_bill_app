// dragdrop.js — HTML5 drag-and-drop controller + tap fallback for mobile
//
// Strategi: aktifkan KEDUANYA (drag dan tap) secara bersamaan — tidak eksklusif.
// Drag & drop tetap berfungsi di desktop; tap fallback aktif di semua perangkat
// sebagai alternatif (terutama berguna di perangkat touch/mobile).
//
// Alur HTML5 Drag & Drop (desktop):
//   dragstart (participant card) → dragover/dragenter (item zone) → drop → assignParticipant
//
// Alur Tap Fallback (mobile/touch):
//   tap participant card → tap item zone → assignParticipant

// ── State drag & drop ─────────────────────────────────────────────────────────

/**
 * State internal drag & drop controller.
 * Digunakan bersama oleh mekanisme HTML5 drag dan tap fallback.
 *
 * @type {{ isDragging: boolean, draggedParticipantId: string|null, selectedParticipantId: string|null }}
 */
export const dragState = {
  isDragging: false,
  draggedParticipantId: null,
  selectedParticipantId: null,
};

// ── Deteksi perangkat ─────────────────────────────────────────────────────────

/**
 * Deteksi apakah perangkat saat ini mendukung touch input.
 *
 * @returns {boolean} `true` jika perangkat mendukung touch
 */
export function detectTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ── Helper internal ───────────────────────────────────────────────────────────

/**
 * Ambil semua elemen drop zone item yang ada di DOM saat ini.
 * Drop zone item diidentifikasi dengan atribut `data-item-id`.
 *
 * @returns {HTMLElement[]}
 */
function _getAllItemDropZones() {
  return Array.from(document.querySelectorAll('[data-item-id]'));
}

/**
 * Ambil semua elemen kartu participant yang ada di DOM saat ini.
 * Kartu participant diidentifikasi dengan atribut `data-participant-id`.
 *
 * @returns {HTMLElement[]}
 */
function _getAllParticipantCards() {
  return Array.from(document.querySelectorAll('[data-participant-id]'));
}

/**
 * Hapus semua class highlight drag & drop dari seluruh elemen terkait.
 * Dipanggil saat drag berakhir atau setelah assignment berhasil.
 */
function _clearAllHighlights() {
  _getAllItemDropZones().forEach((zone) => {
    zone.classList.remove('drop-target-active', 'drag-over', 'tap-target-active');
  });
  _getAllParticipantCards().forEach((card) => {
    card.classList.remove('tap-selected');
  });
}

// ── HTML5 Drag & Drop (desktop) ───────────────────────────────────────────────

/**
 * Pasang event listener HTML5 drag & drop pada satu pasang elemen:
 * kartu participant (drag source) dan item drop zone (drop target).
 *
 * Fungsi ini dipanggil untuk setiap kombinasi participant card × item drop zone
 * setelah setiap re-render.
 *
 * @param {HTMLElement} participantEl - Elemen kartu participant (`[data-participant-id]`)
 * @param {HTMLElement} itemEl        - Elemen drop zone item (`[data-item-id]`)
 * @param {Function}    onAssign      - Callback `(itemId, participantId) => void`
 */
export function enableDragDrop(participantEl, itemEl, onAssign) {
  const participantId = participantEl.getAttribute('data-participant-id');
  const itemId = itemEl.getAttribute('data-item-id');

  if (!participantId || !itemId) return;

  // ── Drag source: participant card ─────────────────────────────────────────

  participantEl.addEventListener('dragstart', (event) => {
    // Simpan participantId di dataTransfer agar bisa dibaca saat drop
    event.dataTransfer.setData('participantId', participantId);
    event.dataTransfer.effectAllowed = 'copy';

    // Update dragState
    dragState.isDragging = true;
    dragState.draggedParticipantId = participantId;

    participantEl.classList.add('dragging');

    // Highlight semua drop zone sebagai target yang valid
    _getAllItemDropZones().forEach((zone) => {
      zone.classList.add('drop-target-active');
    });
  });

  participantEl.addEventListener('dragend', () => {
    // Bersihkan state dan semua highlight
    dragState.isDragging = false;
    dragState.draggedParticipantId = null;

    participantEl.classList.remove('dragging');
    _clearAllHighlights();
  });

  // ── Drop target: item drop zone ───────────────────────────────────────────

  itemEl.addEventListener('dragenter', (event) => {
    event.preventDefault();
    itemEl.classList.add('drag-over');
  });

  itemEl.addEventListener('dragover', (event) => {
    // Wajib preventDefault agar drop event bisa terpicu
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    itemEl.classList.add('drag-over');
  });

  itemEl.addEventListener('dragleave', (event) => {
    // Hanya hapus class jika benar-benar keluar dari elemen (bukan ke child element)
    if (!itemEl.contains(event.relatedTarget)) {
      itemEl.classList.remove('drag-over');
    }
  });

  itemEl.addEventListener('drop', (event) => {
    event.preventDefault();
    itemEl.classList.remove('drag-over');

    const droppedParticipantId = event.dataTransfer.getData('participantId');
    if (droppedParticipantId) {
      onAssign(itemId, droppedParticipantId);
    }

    // Bersihkan semua highlight setelah drop
    _clearAllHighlights();
  });
}

// ── Tap Fallback (mobile / touch) ─────────────────────────────────────────────

/**
 * Pasang event listener tap fallback pada satu pasang elemen:
 * kartu participant (tap source) dan item drop zone (tap target).
 *
 * Alur:
 * 1. User tap participant card → participant terpilih (`.tap-selected`), semua item
 *    drop zone mendapat class `.tap-target-active`
 * 2. User tap item drop zone (saat ada participant terpilih) → `onAssign` dipanggil,
 *    state dibersihkan, semua class dihapus
 *
 * Jika user tap participant card lain saat sudah ada yang terpilih, pilihan berpindah
 * ke participant yang baru di-tap.
 *
 * @param {HTMLElement} participantEl - Elemen kartu participant (`[data-participant-id]`)
 * @param {HTMLElement} itemEl        - Elemen drop zone item (`[data-item-id]`)
 * @param {Function}    onAssign      - Callback `(itemId, participantId) => void`
 */
export function enableTapFallback(participantEl, itemEl, onAssign) {
  const participantId = participantEl.getAttribute('data-participant-id');
  const itemId = itemEl.getAttribute('data-item-id');

  if (!participantId || !itemId) return;

  // ── Tap pada participant card ─────────────────────────────────────────────

  participantEl.addEventListener('click', (event) => {
    // Jangan proses klik pada tombol hapus di dalam kartu
    if (event.target.closest('.btn-remove')) return;

    if (dragState.selectedParticipantId === participantId) {
      // Tap ulang participant yang sama → batalkan pilihan
      dragState.selectedParticipantId = null;
      _clearAllHighlights();
      return;
    }

    // Pilih participant ini
    dragState.selectedParticipantId = participantId;

    // Hapus highlight lama, lalu terapkan yang baru
    _clearAllHighlights();

    participantEl.classList.add('tap-selected');

    // Highlight semua item drop zone sebagai target yang valid
    _getAllItemDropZones().forEach((zone) => {
      zone.classList.add('tap-target-active');
    });
  });

  // ── Tap pada item drop zone ───────────────────────────────────────────────

  itemEl.addEventListener('click', (event) => {
    // Jangan proses klik pada tombol di dalam item (hapus, tugaskan semua, badge remove)
    if (event.target.closest('button')) return;

    const selectedId = dragState.selectedParticipantId;
    if (!selectedId) return; // Tidak ada participant yang terpilih, abaikan

    // Lakukan assignment
    onAssign(itemId, selectedId);

    // Bersihkan state tap
    dragState.selectedParticipantId = null;
    _clearAllHighlights();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Inisialisasi drag & drop controller.
 *
 * Fungsi ini harus dipanggil setelah setiap re-render karena DOM di-replace
 * secara penuh (stateless render). Event listener di-attach ulang ke elemen
 * baru yang dibuat oleh render.
 *
 * Kedua mekanisme (HTML5 drag & drop DAN tap fallback) diaktifkan secara
 * bersamaan — tidak eksklusif. Ini memastikan:
 * - Desktop: drag & drop berfungsi normal
 * - Mobile/touch: tap fallback tersedia sebagai alternatif
 * - Desktop dengan touch screen: keduanya berfungsi
 *
 * @param {object}   state    - AppState (digunakan untuk membaca participants/items)
 * @param {Function} onAssign - Callback assignment `(itemId, participantId) => void`
 */
export function init(state, onAssign) {
  const participantCards = _getAllParticipantCards();
  const itemDropZones = _getAllItemDropZones();

  // Tidak ada yang perlu di-wire jika salah satu daftar kosong
  if (participantCards.length === 0 || itemDropZones.length === 0) return;

  // Pasang event listener untuk setiap kombinasi participant × item
  participantCards.forEach((participantEl) => {
    itemDropZones.forEach((itemEl) => {
      enableDragDrop(participantEl, itemEl, onAssign);
      enableTapFallback(participantEl, itemEl, onAssign);
    });
  });
}
