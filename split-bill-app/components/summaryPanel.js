// summaryPanel.js — komponen panel ringkasan total per peserta dan rincian item yang ditanggung

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
 * Render panel ringkasan pembagian tagihan.
 *
 * Menampilkan:
 * - Total tagihan keseluruhan (subtotal + pajak + tip)
 * - Per peserta: nama, total yang harus dibayar, rincian item yang ditanggung
 * - Seksi "Belum ditugaskan" jika ada item yang tidak memiliki assignment
 *
 * Fungsi ini menghapus dan merender ulang seluruh isi container setiap kali dipanggil
 * (stateless render). Perubahan state memicu re-render via observer pattern di app.js.
 *
 * @param {import('../calculation.js').Summary} summary - Hasil kalkulasi dari calculateSummary
 * @param {HTMLElement} container - Elemen DOM yang akan diisi
 */
export function renderSummaryPanel(summary, container) {
  // Bersihkan container
  container.innerHTML = '';

  // ── Judul panel ──────────────────────────────────────────────────────────
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Ringkasan';
  container.appendChild(title);

  // ── Total tagihan ─────────────────────────────────────────────────────────
  const totalSection = _createTotalSection(summary);
  container.appendChild(totalSection);

  // ── Daftar per peserta ────────────────────────────────────────────────────
  if (summary.participantShares.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.innerHTML =
      '<span class="empty-state-icon" aria-hidden="true">📊</span><br>Belum ada peserta. Tambahkan peserta dan item untuk melihat ringkasan.';
    container.appendChild(empty);
  } else {
    const shareList = document.createElement('ul');
    shareList.className = 'participant-summary-list';
    shareList.setAttribute('aria-label', 'Ringkasan per peserta');

    summary.participantShares.forEach((share) => {
      const card = _createParticipantSummaryCard(share);
      shareList.appendChild(card);
    });

    container.appendChild(shareList);
  }

  // ── Seksi item belum ditugaskan ───────────────────────────────────────────
  if (summary.unassignedItems && summary.unassignedItems.length > 0) {
    const unassignedSection = _createUnassignedSection(summary);
    container.appendChild(unassignedSection);
  }
}

/**
 * Buat seksi total tagihan (subtotal + pajak + tip = total).
 *
 * @param {import('../calculation.js').Summary} summary
 * @returns {HTMLElement}
 */
function _createTotalSection(summary) {
  const section = document.createElement('div');
  section.className = 'summary-total';
  section.setAttribute(
    'aria-label',
    `Total tagihan: ${_formatCurrency(summary.totalBill)}`
  );

  // Baris subtotal
  const subtotalRow = document.createElement('div');
  subtotalRow.className = 'summary-breakdown-row';

  const subtotalLabel = document.createElement('span');
  subtotalLabel.className = 'summary-total-label';
  subtotalLabel.textContent = 'Subtotal';
  subtotalRow.appendChild(subtotalLabel);

  const subtotalValue = document.createElement('span');
  subtotalValue.textContent = _formatCurrency(summary.subtotal);
  subtotalRow.appendChild(subtotalValue);

  section.appendChild(subtotalRow);

  // Baris pajak (hanya tampil jika > 0)
  if (summary.taxAmount > 0) {
    const taxRow = document.createElement('div');
    taxRow.className = 'summary-breakdown-row';

    const taxLabel = document.createElement('span');
    taxLabel.className = 'summary-total-label';
    taxLabel.textContent = 'Pajak';
    taxRow.appendChild(taxLabel);

    const taxValue = document.createElement('span');
    taxValue.textContent = _formatCurrency(summary.taxAmount);
    taxRow.appendChild(taxValue);

    section.appendChild(taxRow);
  }

  // Baris tip (hanya tampil jika > 0)
  if (summary.tipAmount > 0) {
    const tipRow = document.createElement('div');
    tipRow.className = 'summary-breakdown-row';

    const tipLabel = document.createElement('span');
    tipLabel.className = 'summary-total-label';
    tipLabel.textContent = 'Tip';
    tipRow.appendChild(tipLabel);

    const tipValue = document.createElement('span');
    tipValue.textContent = _formatCurrency(summary.tipAmount);
    tipRow.appendChild(tipValue);

    section.appendChild(tipRow);
  }

  // Baris total keseluruhan
  const totalRow = document.createElement('div');
  totalRow.className = 'summary-breakdown-row summary-grand-total';

  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total';
  totalRow.appendChild(totalLabel);

  const totalValue = document.createElement('span');
  totalValue.textContent = _formatCurrency(summary.totalBill);
  totalRow.appendChild(totalValue);

  section.appendChild(totalRow);

  return section;
}

/**
 * Buat kartu ringkasan untuk satu peserta.
 *
 * @param {import('../calculation.js').ParticipantShare} share
 * @returns {HTMLLIElement}
 */
function _createParticipantSummaryCard(share) {
  const card = document.createElement('li');
  card.className = 'participant-summary-card';
  card.setAttribute(
    'aria-label',
    `${share.name}: total ${_formatCurrency(share.total)}`
  );

  // ── Header: nama + total ──────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'participant-summary-header';

  const nameEl = document.createElement('span');
  nameEl.className = 'participant-summary-name';
  nameEl.textContent = share.name;
  header.appendChild(nameEl);

  const totalEl = document.createElement('span');
  totalEl.className = 'participant-summary-total';
  totalEl.textContent = _formatCurrency(share.total);
  header.appendChild(totalEl);

  card.appendChild(header);

  // ── Rincian item ──────────────────────────────────────────────────────────
  if (share.items && share.items.length > 0) {
    const itemsSection = document.createElement('div');
    itemsSection.className = 'participant-summary-items';
    itemsSection.setAttribute('aria-label', `Rincian item ${share.name}`);

    share.items.forEach((itemDetail) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'participant-summary-item';

      const itemName = document.createElement('span');
      itemName.textContent = itemDetail.name;
      itemRow.appendChild(itemName);

      const itemShare = document.createElement('span');
      itemShare.textContent = _formatCurrency(itemDetail.share);
      itemRow.appendChild(itemShare);

      itemsSection.appendChild(itemRow);
    });

    // Baris pajak (hanya tampil jika > 0)
    if (share.taxShare > 0) {
      const taxRow = document.createElement('div');
      taxRow.className = 'participant-summary-item';

      const taxLabel = document.createElement('span');
      taxLabel.textContent = 'Pajak';
      taxRow.appendChild(taxLabel);

      const taxValue = document.createElement('span');
      taxValue.textContent = _formatCurrency(share.taxShare);
      taxRow.appendChild(taxValue);

      itemsSection.appendChild(taxRow);
    }

    // Baris tip (hanya tampil jika > 0)
    if (share.tipShare > 0) {
      const tipRow = document.createElement('div');
      tipRow.className = 'participant-summary-item';

      const tipLabel = document.createElement('span');
      tipLabel.textContent = 'Tip';
      tipRow.appendChild(tipLabel);

      const tipValue = document.createElement('span');
      tipValue.textContent = _formatCurrency(share.tipShare);
      tipRow.appendChild(tipValue);

      itemsSection.appendChild(tipRow);
    }

    card.appendChild(itemsSection);
  }

  return card;
}

/**
 * Buat seksi peringatan item yang belum ditugaskan ke peserta manapun.
 *
 * @param {import('../calculation.js').Summary} summary
 * @returns {HTMLElement}
 */
function _createUnassignedSection(summary) {
  const section = document.createElement('div');
  section.className = 'unassigned-section';
  section.setAttribute('role', 'alert');
  section.setAttribute(
    'aria-label',
    `${summary.unassignedItems.length} item belum ditugaskan`
  );

  const titleEl = document.createElement('p');
  titleEl.className = 'unassigned-title';
  titleEl.innerHTML = '⚠ Belum ditugaskan';
  section.appendChild(titleEl);

  const desc = document.createElement('p');
  desc.style.fontSize = 'var(--font-size-sm)';
  desc.style.color = 'var(--color-warning)';
  desc.textContent = `${summary.unassignedItems.length} item belum ditugaskan ke peserta manapun. Harga item tersebut sudah termasuk dalam total tagihan.`;
  section.appendChild(desc);

  return section;
}
