// billPanel.js — komponen panel daftar item tagihan dan form tambah item

import { calculateSubtotal } from '../calculation.js';

/**
 * Format angka sebagai mata uang (tanpa simbol, 2 desimal).
 * Contoh: 25000 → "25.000,00"
 *
 * @param {number} amount
 * @returns {string}
 */
function _formatCurrency(amount) {
  return amount.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Render panel item tagihan: form tambah item + daftar item + subtotal.
 *
 * Fungsi ini menghapus dan merender ulang seluruh isi container setiap kali dipanggil
 * (stateless render). Perubahan state memicu re-render via observer pattern di app.js.
 *
 * @param {import('../state.js').AppState} state - State aplikasi
 * @param {HTMLElement} container - Elemen DOM yang akan diisi
 */
export function renderBillPanel(state, container) {
  // Bersihkan container
  container.innerHTML = '';

  // ── Judul panel ──────────────────────────────────────────────────────────
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Item Tagihan';
  container.appendChild(title);

  // ── Form tambah item ──────────────────────────────────────────────────────
  const form = _createAddItemForm(state);
  container.appendChild(form);

  // ── Daftar item ───────────────────────────────────────────────────────────
  const list = document.createElement('ul');
  list.className = 'item-list';
  list.setAttribute('aria-label', 'Daftar item tagihan');

  if (state.items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.innerHTML =
      '<span class="empty-state-icon" aria-hidden="true">🧾</span><br>Belum ada item. Tambahkan item di atas.';
    list.appendChild(empty);
  } else {
    state.items.forEach((item) => {
      const itemEl = _createBillItemElement(item, state);
      list.appendChild(itemEl);
    });
  }

  container.appendChild(list);

  // ── Subtotal ──────────────────────────────────────────────────────────────
  const subtotalRow = document.createElement('div');
  subtotalRow.className = 'subtotal-row';
  subtotalRow.setAttribute('aria-label', `Subtotal: ${_formatCurrency(calculateSubtotal(state.items))}`);

  const subtotalLabel = document.createElement('span');
  subtotalLabel.textContent = 'Subtotal';

  const subtotalValue = document.createElement('span');
  subtotalValue.className = 'subtotal-value';
  subtotalValue.textContent = _formatCurrency(calculateSubtotal(state.items));

  subtotalRow.appendChild(subtotalLabel);
  subtotalRow.appendChild(subtotalValue);
  container.appendChild(subtotalRow);
}

/**
 * Buat form tambah item baru.
 *
 * @param {import('../state.js').AppState} state
 * @returns {HTMLFormElement}
 */
function _createAddItemForm(state) {
  const form = document.createElement('form');
  form.className = 'add-form';
  form.setAttribute('aria-label', 'Form tambah item tagihan');
  form.noValidate = true;

  // ── Baris input nama ──────────────────────────────────────────────────────
  const nameGroup = document.createElement('div');
  nameGroup.className = 'form-group';

  const nameLabel = document.createElement('label');
  nameLabel.htmlFor = 'item-name-input';
  nameLabel.className = 'form-label';
  nameLabel.textContent = 'Nama item';
  nameGroup.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'item-name-input';
  nameInput.className = 'form-input';
  nameInput.placeholder = 'Nama item';
  nameInput.setAttribute('aria-label', 'Nama item baru');
  nameInput.setAttribute('aria-describedby', 'item-error');
  nameInput.autocomplete = 'off';
  nameGroup.appendChild(nameInput);

  form.appendChild(nameGroup);

  // ── Baris input harga + tombol submit ─────────────────────────────────────
  const priceGroup = document.createElement('div');
  priceGroup.className = 'form-group';

  const priceLabel = document.createElement('label');
  priceLabel.htmlFor = 'item-price-input';
  priceLabel.className = 'form-label';
  priceLabel.textContent = 'Harga';
  priceGroup.appendChild(priceLabel);

  const formRow = document.createElement('div');
  formRow.className = 'form-row';

  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.id = 'item-price-input';
  priceInput.className = 'form-input';
  priceInput.placeholder = '0';
  priceInput.min = '0.01';
  priceInput.step = 'any';
  priceInput.setAttribute('aria-label', 'Harga item baru');
  priceInput.setAttribute('aria-describedby', 'item-error');
  formRow.appendChild(priceInput);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Tambah';
  submitBtn.setAttribute('aria-label', 'Tambah item tagihan');
  formRow.appendChild(submitBtn);

  priceGroup.appendChild(formRow);
  form.appendChild(priceGroup);

  // ── Pesan error inline ────────────────────────────────────────────────────
  const errorMsg = document.createElement('p');
  errorMsg.id = 'item-error';
  errorMsg.className = 'form-error';
  errorMsg.setAttribute('role', 'alert');
  errorMsg.setAttribute('aria-live', 'polite');
  form.appendChild(errorMsg);

  // ── Event: submit form ────────────────────────────────────────────────────
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = nameInput.value;
    const priceRaw = priceInput.value;
    const price = priceRaw === '' ? NaN : Number(priceRaw);

    const result = state.addItem(name, price);

    if (result && result.success === false) {
      errorMsg.textContent = result.error || 'Terjadi kesalahan';
      errorMsg.classList.add('visible');

      // Fokus ke field yang bermasalah
      if (!name || name.trim() === '') {
        nameInput.classList.add('error');
        nameInput.focus();
      } else {
        priceInput.classList.add('error');
        priceInput.focus();
      }
    } else {
      // Berhasil: bersihkan error dan input
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
      nameInput.classList.remove('error');
      priceInput.classList.remove('error');
      nameInput.value = '';
      priceInput.value = '';
      nameInput.focus();
      // Re-render dipicu oleh observer pattern (state.subscribe → render)
    }
  });

  // Hapus error saat user mulai mengetik ulang
  const clearError = () => {
    if (errorMsg.classList.contains('visible')) {
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
      nameInput.classList.remove('error');
      priceInput.classList.remove('error');
    }
  };
  nameInput.addEventListener('input', clearError);
  priceInput.addEventListener('input', clearError);

  return form;
}

/**
 * Buat elemen list item untuk satu item tagihan.
 *
 * @param {import('../state.js').BillItem} item
 * @param {import('../state.js').AppState} state
 * @returns {HTMLLIElement}
 */
function _createBillItemElement(item, state) {
  const isUnassigned = !Array.isArray(item.assignedTo) || item.assignedTo.length === 0;

  const li = document.createElement('li');
  li.className = 'bill-item' + (isUnassigned ? ' unassigned-warning' : '');
  li.setAttribute('data-item-id', item.id);
  li.setAttribute('role', 'listitem');
  li.setAttribute(
    'aria-label',
    `Item: ${item.name}, harga ${_formatCurrency(item.price)}${isUnassigned ? ', belum ditugaskan' : ''}`
  );

  // ── Header: nama, harga, tombol aksi ─────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'bill-item-header';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'bill-item-name';
  nameSpan.textContent = item.name;
  header.appendChild(nameSpan);

  const priceSpan = document.createElement('span');
  priceSpan.className = 'bill-item-price';
  priceSpan.textContent = _formatCurrency(item.price);
  header.appendChild(priceSpan);

  // Tombol aksi: "Tugaskan Semua" + hapus
  const actions = document.createElement('div');
  actions.className = 'bill-item-actions';

  const assignAllBtn = document.createElement('button');
  assignAllBtn.type = 'button';
  assignAllBtn.className = 'btn btn-ghost btn-sm';
  assignAllBtn.textContent = 'Tugaskan Semua';
  assignAllBtn.setAttribute('aria-label', `Tugaskan semua peserta ke ${item.name}`);
  assignAllBtn.disabled = state.participants.length === 0;
  assignAllBtn.addEventListener('click', () => {
    state.assignAll(item.id);
    // Re-render dipicu oleh observer pattern
  });
  actions.appendChild(assignAllBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger btn-sm btn-icon btn-remove';
  deleteBtn.textContent = '×';
  deleteBtn.setAttribute('aria-label', `Hapus item ${item.name}`);
  deleteBtn.addEventListener('click', () => {
    state.removeItem(item.id);
    // Re-render dipicu oleh observer pattern
  });
  actions.appendChild(deleteBtn);

  header.appendChild(actions);
  li.appendChild(header);

  // ── Area assignment: badge peserta yang di-assign ─────────────────────────
  const assignmentsDiv = document.createElement('div');
  assignmentsDiv.className = 'bill-item-assignments';
  assignmentsDiv.setAttribute(
    'aria-label',
    isUnassigned
      ? `${item.name} belum ditugaskan ke peserta manapun`
      : `Peserta yang ditugaskan ke ${item.name}`
  );

  if (!isUnassigned) {
    item.assignedTo.forEach((participantId) => {
      const participant = state.participants.find((p) => p.id === participantId);
      if (!participant) return; // participant sudah dihapus, skip

      const badge = _createAssignmentBadge(participant, item, state);
      assignmentsDiv.appendChild(badge);
    });
  }

  li.appendChild(assignmentsDiv);

  // ── Drag & drop event listeners pada drop zone ────────────────────────────
  li.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    li.classList.add('drag-over');
  });

  li.addEventListener('dragenter', (event) => {
    event.preventDefault();
    li.classList.add('drag-over');
  });

  li.addEventListener('dragleave', (event) => {
    // Hanya hapus class jika benar-benar keluar dari elemen (bukan ke child)
    if (!li.contains(event.relatedTarget)) {
      li.classList.remove('drag-over');
    }
  });

  li.addEventListener('drop', (event) => {
    event.preventDefault();
    li.classList.remove('drag-over');

    const participantId = event.dataTransfer.getData('participantId');
    if (participantId) {
      state.assignParticipant(item.id, participantId);
      // Re-render dipicu oleh observer pattern
    }
  });

  return li;
}

/**
 * Buat badge assignment untuk satu peserta pada satu item.
 *
 * @param {{ id: string, name: string }} participant
 * @param {import('../state.js').BillItem} item
 * @param {import('../state.js').AppState} state
 * @returns {HTMLSpanElement}
 */
function _createAssignmentBadge(participant, item, state) {
  const badge = document.createElement('span');
  badge.className = 'assignment-badge';
  badge.setAttribute('aria-label', `${participant.name} ditugaskan ke ${item.name}`);

  const nameSpan = document.createElement('span');
  nameSpan.textContent = participant.name;
  badge.appendChild(nameSpan);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '×';
  removeBtn.setAttribute(
    'aria-label',
    `Hapus penugasan ${participant.name} dari ${item.name}`
  );
  removeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    state.removeAssignment(item.id, participant.id);
    // Re-render dipicu oleh observer pattern
  });
  badge.appendChild(removeBtn);

  return badge;
}
