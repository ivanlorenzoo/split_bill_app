// participantPanel.js — komponen panel daftar peserta dan form tambah peserta

/**
 * Render panel participant: form tambah peserta + daftar kartu peserta.
 *
 * Fungsi ini menghapus dan merender ulang seluruh isi container setiap kali dipanggil
 * (stateless render). Perubahan state memicu re-render via observer pattern di app.js.
 *
 * @param {import('../state.js').AppState} state - State aplikasi
 * @param {HTMLElement} container - Elemen DOM yang akan diisi
 */
export function renderParticipantPanel(state, container) {
  // Bersihkan container
  container.innerHTML = '';

  // ── Judul panel ──────────────────────────────────────────────────────────
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Peserta';
  container.appendChild(title);

  // ── Form tambah peserta ───────────────────────────────────────────────────
  const form = document.createElement('form');
  form.className = 'add-form';
  form.setAttribute('aria-label', 'Form tambah peserta');
  form.noValidate = true;

  // Label untuk input
  const label = document.createElement('label');
  label.htmlFor = 'participant-name-input';
  label.className = 'form-label';
  label.textContent = 'Nama peserta';
  form.appendChild(label);

  // Baris input + tombol
  const formRow = document.createElement('div');
  formRow.className = 'form-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'participant-name-input';
  input.className = 'form-input';
  input.placeholder = 'Nama peserta';
  input.setAttribute('aria-label', 'Nama peserta baru');
  input.setAttribute('aria-describedby', 'participant-error');
  input.autocomplete = 'off';
  formRow.appendChild(input);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Tambah';
  submitBtn.setAttribute('aria-label', 'Tambah peserta');
  formRow.appendChild(submitBtn);

  form.appendChild(formRow);

  // Pesan error inline
  const errorMsg = document.createElement('p');
  errorMsg.id = 'participant-error';
  errorMsg.className = 'form-error';
  errorMsg.setAttribute('role', 'alert');
  errorMsg.setAttribute('aria-live', 'polite');
  form.appendChild(errorMsg);

  // ── Event: submit form ────────────────────────────────────────────────────
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = input.value;
    const result = state.addParticipant(name);

    if (result && result.success === false) {
      // Tampilkan error
      errorMsg.textContent = result.error || 'Terjadi kesalahan';
      errorMsg.classList.add('visible');
      input.classList.add('error');
      input.focus();
    } else {
      // Berhasil: bersihkan error dan input
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
      input.classList.remove('error');
      input.value = '';
      input.focus();
      // Re-render dipicu oleh observer pattern (state.subscribe → render)
    }
  });

  // Hapus error saat user mulai mengetik ulang
  input.addEventListener('input', () => {
    if (errorMsg.classList.contains('visible')) {
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
      input.classList.remove('error');
    }
  });

  container.appendChild(form);

  // ── Jumlah peserta ────────────────────────────────────────────────────────
  const count = document.createElement('p');
  count.className = 'participant-count';
  const n = state.participants.length;
  count.textContent = `${n} peserta (maks. 20)`;
  container.appendChild(count);

  // ── Daftar kartu peserta ──────────────────────────────────────────────────
  const list = document.createElement('ul');
  list.className = 'participant-list';
  list.setAttribute('aria-label', 'Daftar peserta');

  if (state.participants.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-state-icon" aria-hidden="true">👥</span><br>Belum ada peserta. Tambahkan peserta di atas.';
    list.appendChild(empty);
  } else {
    state.participants.forEach((participant) => {
      const card = _createParticipantCard(participant, state);
      list.appendChild(card);
    });
  }

  container.appendChild(list);
}

/**
 * Buat elemen kartu peserta.
 *
 * @param {{ id: string, name: string }} participant
 * @param {import('../state.js').AppState} state
 * @returns {HTMLLIElement}
 */
function _createParticipantCard(participant, state) {
  const card = document.createElement('li');
  card.className = 'participant-card';
  card.setAttribute('data-participant-id', participant.id);
  card.setAttribute('draggable', 'true');
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `Peserta: ${participant.name}. Seret untuk menugaskan ke item.`);

  // Nama peserta
  const nameSpan = document.createElement('span');
  nameSpan.className = 'participant-name';
  nameSpan.textContent = participant.name;
  card.appendChild(nameSpan);

  // Tombol hapus
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger btn-sm btn-icon btn-remove';
  deleteBtn.setAttribute('aria-label', `Hapus ${participant.name}`);
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    state.removeParticipant(participant.id);
    // Re-render dipicu oleh observer pattern
  });
  card.appendChild(deleteBtn);

  // ── Drag events ───────────────────────────────────────────────────────────
  card.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('participantId', participant.id);
    event.dataTransfer.effectAllowed = 'copy';
    card.classList.add('dragging');

    // Highlight semua item drop zone
    _getAllItemDropZones().forEach((zone) => {
      zone.classList.add('drop-target-active');
    });
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');

    // Hapus highlight dari semua item drop zone
    _getAllItemDropZones().forEach((zone) => {
      zone.classList.remove('drop-target-active');
      zone.classList.remove('drag-over');
    });
  });

  return card;
}

/**
 * Ambil semua elemen drop zone item yang ada di DOM saat ini.
 * Drop zone item diidentifikasi dengan atribut `data-item-id`.
 *
 * @returns {HTMLElement[]}
 */
function _getAllItemDropZones() {
  return Array.from(document.querySelectorAll('[data-item-id]'));
}
