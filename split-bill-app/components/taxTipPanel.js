// taxTipPanel.js — komponen panel input persentase pajak dan tip beserta nilai mata uangnya

import { calculateSubtotal, calculateTaxAmount, calculateTipAmount } from '../calculation.js';

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
 * Render panel input pajak dan tip.
 *
 * Menampilkan dua baris input (tax rate % dan tip rate %) masing-masing dengan
 * tampilan nilai dalam mata uang di sampingnya. Validasi dilakukan secara inline
 * saat nilai berubah; nilai invalid akan menggunakan 0 dan menampilkan pesan error.
 *
 * Fungsi ini menghapus dan merender ulang seluruh isi container setiap kali dipanggil
 * (stateless render). Perubahan state memicu re-render via observer pattern di app.js.
 *
 * @param {import('../state.js').AppState} state - State aplikasi
 * @param {HTMLElement} container - Elemen DOM yang akan diisi
 */
export function renderTaxTipPanel(state, container) {
  // Bersihkan container
  container.innerHTML = '';

  const subtotal = calculateSubtotal(state.items);

  // ── Judul seksi ───────────────────────────────────────────────────────────
  const title = document.createElement('h3');
  title.className = 'panel-title';
  title.textContent = 'Pajak & Tip';
  container.appendChild(title);

  // ── Baris Tax ─────────────────────────────────────────────────────────────
  const taxSection = _createRateRow({
    id: 'tax',
    label: 'Pajak',
    currentRate: state.taxRate,
    subtotal,
    computeAmount: calculateTaxAmount,
    onCommit: (rate) => state.setTaxRate(rate),
  });
  container.appendChild(taxSection.row);
  container.appendChild(taxSection.error);

  // ── Baris Tip ─────────────────────────────────────────────────────────────
  const tipSection = _createRateRow({
    id: 'tip',
    label: 'Tip',
    currentRate: state.tipRate,
    subtotal,
    computeAmount: calculateTipAmount,
    onCommit: (rate) => state.setTipRate(rate),
  });
  container.appendChild(tipSection.row);
  container.appendChild(tipSection.error);
}

/**
 * Buat satu baris input rate (tax atau tip) beserta tampilan nilai mata uang
 * dan pesan error inline.
 *
 * @param {Object} opts
 * @param {string}   opts.id           - "tax" atau "tip" (digunakan untuk id elemen)
 * @param {string}   opts.label        - Label yang ditampilkan ("Pajak" / "Tip")
 * @param {number}   opts.currentRate  - Nilai rate saat ini dari state
 * @param {number}   opts.subtotal     - Subtotal item untuk menghitung nilai mata uang
 * @param {Function} opts.computeAmount - Fungsi kalkulasi (calculateTaxAmount / calculateTipAmount)
 * @param {Function} opts.onCommit     - Callback saat nilai valid di-commit ke state
 * @returns {{ row: HTMLElement, error: HTMLElement }}
 */
function _createRateRow({ id, label, currentRate, subtotal, computeAmount, onCommit }) {
  const inputId = `${id}-rate-input`;
  const errorId = `${id}-rate-error`;
  const amountId = `${id}-amount-display`;

  // ── Baris utama ───────────────────────────────────────────────────────────
  const row = document.createElement('div');
  row.className = 'tax-tip-row';

  // Label
  const labelEl = document.createElement('label');
  labelEl.htmlFor = inputId;
  labelEl.className = 'tax-tip-label';
  labelEl.textContent = label;
  row.appendChild(labelEl);

  // Input persentase
  const input = document.createElement('input');
  input.type = 'number';
  input.id = inputId;
  input.className = 'form-input tax-tip-input';
  input.value = currentRate;
  input.min = '0';
  input.step = 'any';
  input.setAttribute('aria-label', `Persentase ${label.toLowerCase()}`);
  input.setAttribute('aria-describedby', `${errorId} ${amountId}`);
  row.appendChild(input);

  // Simbol persen
  const symbol = document.createElement('span');
  symbol.className = 'tax-tip-symbol';
  symbol.textContent = '%';
  symbol.setAttribute('aria-hidden', 'true');
  row.appendChild(symbol);

  // Tampilan nilai mata uang
  const amountDisplay = document.createElement('span');
  amountDisplay.id = amountId;
  amountDisplay.className = 'tax-tip-amount';
  amountDisplay.textContent = _formatCurrency(computeAmount(subtotal, currentRate));
  amountDisplay.setAttribute(
    'aria-label',
    `Nilai ${label.toLowerCase()}: ${_formatCurrency(computeAmount(subtotal, currentRate))}`
  );
  row.appendChild(amountDisplay);

  // ── Pesan error inline ────────────────────────────────────────────────────
  const errorMsg = document.createElement('p');
  errorMsg.id = errorId;
  errorMsg.className = 'form-error';
  errorMsg.setAttribute('role', 'alert');
  errorMsg.setAttribute('aria-live', 'polite');

  // ── Event: perubahan nilai ────────────────────────────────────────────────
  input.addEventListener('input', () => {
    const raw = input.value;
    const num = raw === '' ? NaN : Number(raw);

    if (Number.isNaN(num) || num < 0) {
      // Nilai tidak valid: tampilkan error, commit 0 ke state
      errorMsg.textContent = 'Nilai harus berupa angka 0 atau lebih';
      errorMsg.classList.add('visible');
      input.classList.add('error');
      amountDisplay.textContent = _formatCurrency(0);
      amountDisplay.setAttribute('aria-label', `Nilai ${label.toLowerCase()}: ${_formatCurrency(0)}`);
      onCommit(0);
    } else {
      // Nilai valid: bersihkan error, update tampilan dan state
      errorMsg.textContent = '';
      errorMsg.classList.remove('visible');
      input.classList.remove('error');
      const amount = computeAmount(subtotal, num);
      amountDisplay.textContent = _formatCurrency(amount);
      amountDisplay.setAttribute(
        'aria-label',
        `Nilai ${label.toLowerCase()}: ${_formatCurrency(amount)}`
      );
      onCommit(num);
      // Re-render dipicu oleh observer pattern (state.subscribe → render)
    }
  });

  return { row, error: errorMsg };
}
