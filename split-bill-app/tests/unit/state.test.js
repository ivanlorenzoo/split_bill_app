// unit tests untuk state.js
import { describe, it, expect, beforeEach } from 'vitest';
import AppState from '../../state.js';

// Reset state sebelum setiap test agar tidak ada efek samping antar test
beforeEach(() => {
  AppState.reset();
});

// ---------------------------------------------------------------------------
// Observer pattern: subscribe / unsubscribe
// ---------------------------------------------------------------------------

describe('subscribe / unsubscribe', () => {
  it('listener dipanggil saat state berubah', () => {
    let callCount = 0;
    AppState.subscribe(() => { callCount++; });

    AppState.addParticipant('Alice');
    expect(callCount).toBe(1);

    AppState.addParticipant('Bob');
    expect(callCount).toBe(2);
  });

  it('unsubscribe menghentikan listener dari dipanggil', () => {
    let callCount = 0;
    const unsubscribe = AppState.subscribe(() => { callCount++; });

    AppState.addParticipant('Alice');
    expect(callCount).toBe(1);

    unsubscribe();

    AppState.addParticipant('Bob');
    expect(callCount).toBe(1); // tidak bertambah setelah unsubscribe
  });

  it('beberapa listener dapat didaftarkan sekaligus', () => {
    let count1 = 0;
    let count2 = 0;

    AppState.subscribe(() => { count1++; });
    AppState.subscribe(() => { count2++; });

    AppState.addParticipant('Alice');

    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it('unsubscribe hanya menghapus listener yang bersangkutan', () => {
    let count1 = 0;
    let count2 = 0;

    const unsub1 = AppState.subscribe(() => { count1++; });
    AppState.subscribe(() => { count2++; });

    unsub1();
    AppState.addParticipant('Alice');

    expect(count1).toBe(0);
    expect(count2).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addParticipant
// ---------------------------------------------------------------------------

describe('addParticipant', () => {
  it('menambahkan participant valid ke state', () => {
    const result = AppState.addParticipant('Alice');
    expect(result.success).toBe(true);
    expect(AppState.participants).toHaveLength(1);
    expect(AppState.participants[0].name).toBe('Alice');
    expect(AppState.participants[0].id).toBeTruthy();
  });

  it('menolak nama kosong', () => {
    const result = AppState.addParticipant('');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(AppState.participants).toHaveLength(0);
  });

  it('menolak nama yang hanya berisi spasi', () => {
    const result = AppState.addParticipant('   ');
    expect(result.success).toBe(false);
    expect(AppState.participants).toHaveLength(0);
  });

  it('menolak nama duplikat (case-insensitive)', () => {
    AppState.addParticipant('Alice');
    const result = AppState.addParticipant('alice');
    expect(result.success).toBe(false);
    // Pesan error menyertakan nama yang diinput (bukan nama yang tersimpan)
    expect(result.error).toContain('alice');
    expect(AppState.participants).toHaveLength(1);
  });

  it('menolak nama duplikat dengan spasi di sekitarnya', () => {
    AppState.addParticipant('Alice');
    const result = AppState.addParticipant('  Alice  ');
    expect(result.success).toBe(false);
    expect(AppState.participants).toHaveLength(1);
  });

  it('menyimpan nama yang sudah di-trim', () => {
    AppState.addParticipant('  Bob  ');
    expect(AppState.participants[0].name).toBe('Bob');
  });

  it('menolak participant ke-21 (batas maksimal 20)', () => {
    for (let i = 1; i <= 20; i++) {
      const result = AppState.addParticipant(`Peserta ${i}`);
      expect(result.success).toBe(true);
    }
    expect(AppState.participants).toHaveLength(20);

    const result = AppState.addParticipant('Peserta 21');
    expect(result.success).toBe(false);
    expect(result.error).toContain('20');
    expect(AppState.participants).toHaveLength(20);
  });

  it('setiap participant mendapat id unik', () => {
    AppState.addParticipant('Alice');
    AppState.addParticipant('Bob');
    const ids = AppState.participants.map((p) => p.id);
    expect(new Set(ids).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// removeParticipant
// ---------------------------------------------------------------------------

describe('removeParticipant', () => {
  it('menghapus participant dari daftar', () => {
    AppState.addParticipant('Alice');
    const aliceId = AppState.participants[0].id;

    AppState.removeParticipant(aliceId);
    expect(AppState.participants).toHaveLength(0);
  });

  it('membersihkan assignment participant yang dihapus dari semua item', () => {
    AppState.addParticipant('Alice');
    AppState.addParticipant('Bob');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const bobId = AppState.participants[1].id;
    const itemId = AppState.items[0].id;

    AppState.assignParticipant(itemId, aliceId);
    AppState.assignParticipant(itemId, bobId);

    expect(AppState.items[0].assignedTo).toContain(aliceId);

    AppState.removeParticipant(aliceId);

    expect(AppState.items[0].assignedTo).not.toContain(aliceId);
    expect(AppState.items[0].assignedTo).toContain(bobId);
  });

  it('membersihkan assignment dari beberapa item sekaligus', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Item 1', 10000);
    AppState.addItem('Item 2', 20000);

    const aliceId = AppState.participants[0].id;
    AppState.assignParticipant(AppState.items[0].id, aliceId);
    AppState.assignParticipant(AppState.items[1].id, aliceId);

    AppState.removeParticipant(aliceId);

    expect(AppState.items[0].assignedTo).not.toContain(aliceId);
    expect(AppState.items[1].assignedTo).not.toContain(aliceId);
  });

  it('tidak mengubah state jika id tidak ditemukan', () => {
    AppState.addParticipant('Alice');
    AppState.removeParticipant('id-tidak-ada');
    expect(AppState.participants).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------

describe('addItem', () => {
  it('menambahkan item valid ke state', () => {
    const result = AppState.addItem('Nasi Goreng', 25000);
    expect(result.success).toBe(true);
    expect(AppState.items).toHaveLength(1);
    expect(AppState.items[0].name).toBe('Nasi Goreng');
    expect(AppState.items[0].price).toBe(25000);
    expect(AppState.items[0].assignedTo).toEqual([]);
  });

  it('menolak nama item kosong', () => {
    const result = AppState.addItem('', 10000);
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menolak nama item yang hanya berisi spasi', () => {
    const result = AppState.addItem('   ', 10000);
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menolak harga 0', () => {
    const result = AppState.addItem('Item', 0);
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menolak harga negatif', () => {
    const result = AppState.addItem('Item', -100);
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menolak harga NaN', () => {
    const result = AppState.addItem('Item', NaN);
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menolak harga berupa string', () => {
    const result = AppState.addItem('Item', '25000');
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menolak harga undefined', () => {
    const result = AppState.addItem('Item', undefined);
    expect(result.success).toBe(false);
    expect(AppState.items).toHaveLength(0);
  });

  it('menyimpan nama yang sudah di-trim', () => {
    AppState.addItem('  Mie Ayam  ', 15000);
    expect(AppState.items[0].name).toBe('Mie Ayam');
  });

  it('setiap item mendapat id unik', () => {
    AppState.addItem('Item 1', 10000);
    AppState.addItem('Item 2', 20000);
    const ids = AppState.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

describe('removeItem', () => {
  it('menghapus item dari state', () => {
    AppState.addItem('Nasi Goreng', 25000);
    const itemId = AppState.items[0].id;

    AppState.removeItem(itemId);
    expect(AppState.items).toHaveLength(0);
  });

  it('tidak mengubah state jika id tidak ditemukan', () => {
    AppState.addItem('Nasi Goreng', 25000);
    AppState.removeItem('id-tidak-ada');
    expect(AppState.items).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// updateItem
// ---------------------------------------------------------------------------

describe('updateItem', () => {
  it('memperbarui nama item', () => {
    AppState.addItem('Nasi Goreng', 25000);
    const itemId = AppState.items[0].id;

    const result = AppState.updateItem(itemId, { name: 'Nasi Uduk' });
    expect(result.success).toBe(true);
    expect(AppState.items[0].name).toBe('Nasi Uduk');
  });

  it('memperbarui harga item', () => {
    AppState.addItem('Nasi Goreng', 25000);
    const itemId = AppState.items[0].id;

    const result = AppState.updateItem(itemId, { price: 30000 });
    expect(result.success).toBe(true);
    expect(AppState.items[0].price).toBe(30000);
  });

  it('menolak nama kosong saat update', () => {
    AppState.addItem('Nasi Goreng', 25000);
    const itemId = AppState.items[0].id;

    const result = AppState.updateItem(itemId, { name: '' });
    expect(result.success).toBe(false);
    expect(AppState.items[0].name).toBe('Nasi Goreng'); // tidak berubah
  });

  it('menolak harga invalid saat update', () => {
    AppState.addItem('Nasi Goreng', 25000);
    const itemId = AppState.items[0].id;

    const result = AppState.updateItem(itemId, { price: -100 });
    expect(result.success).toBe(false);
    expect(AppState.items[0].price).toBe(25000); // tidak berubah
  });

  it('mengembalikan error jika item tidak ditemukan', () => {
    const result = AppState.updateItem('id-tidak-ada', { name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('tidak mengubah id item saat update', () => {
    AppState.addItem('Nasi Goreng', 25000);
    const originalId = AppState.items[0].id;

    AppState.updateItem(originalId, { id: 'id-baru', name: 'Nasi Uduk' });
    expect(AppState.items[0].id).toBe(originalId);
  });
});

// ---------------------------------------------------------------------------
// assignParticipant / removeAssignment / assignAll
// ---------------------------------------------------------------------------

describe('assignParticipant', () => {
  it('menugaskan participant ke item', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const itemId = AppState.items[0].id;

    AppState.assignParticipant(itemId, aliceId);
    expect(AppState.items[0].assignedTo).toContain(aliceId);
  });

  it('tidak menduplikasi assignment yang sudah ada', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const itemId = AppState.items[0].id;

    AppState.assignParticipant(itemId, aliceId);
    AppState.assignParticipant(itemId, aliceId);

    expect(AppState.items[0].assignedTo.filter((id) => id === aliceId)).toHaveLength(1);
  });
});

describe('removeAssignment', () => {
  it('menghapus penugasan participant dari item', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const itemId = AppState.items[0].id;

    AppState.assignParticipant(itemId, aliceId);
    AppState.removeAssignment(itemId, aliceId);

    expect(AppState.items[0].assignedTo).not.toContain(aliceId);
  });

  it('tidak mengubah state jika participant tidak di-assign ke item', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const itemId = AppState.items[0].id;

    AppState.removeAssignment(itemId, aliceId);
    expect(AppState.items[0].assignedTo).toHaveLength(0);
  });
});

describe('assignAll', () => {
  it('menugaskan semua participant ke item', () => {
    AppState.addParticipant('Alice');
    AppState.addParticipant('Bob');
    AppState.addParticipant('Carol');
    AppState.addItem('Nasi Goreng', 25000);

    const itemId = AppState.items[0].id;
    AppState.assignAll(itemId);

    const allIds = AppState.participants.map((p) => p.id);
    for (const id of allIds) {
      expect(AppState.items[0].assignedTo).toContain(id);
    }
  });

  it('tidak menduplikasi participant yang sudah di-assign', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const itemId = AppState.items[0].id;

    AppState.assignParticipant(itemId, aliceId);
    AppState.assignAll(itemId);

    expect(AppState.items[0].assignedTo.filter((id) => id === aliceId)).toHaveLength(1);
  });

  it('tidak mengubah item lain', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Item 1', 10000);
    AppState.addItem('Item 2', 20000);

    const item1Id = AppState.items[0].id;
    const item2Id = AppState.items[1].id;

    AppState.assignAll(item1Id);

    expect(AppState.items[1].assignedTo).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// setTaxRate / setTipRate
// ---------------------------------------------------------------------------

describe('setTaxRate', () => {
  it('mengatur tax rate yang valid', () => {
    const result = AppState.setTaxRate(10);
    expect(result.success).toBe(true);
    expect(AppState.taxRate).toBe(10);
  });

  it('menerima 0 sebagai nilai valid', () => {
    AppState.setTaxRate(10);
    const result = AppState.setTaxRate(0);
    expect(result.success).toBe(true);
    expect(AppState.taxRate).toBe(0);
  });

  it('menggunakan 0 jika nilai negatif', () => {
    const result = AppState.setTaxRate(-5);
    expect(result.success).toBe(false);
    expect(AppState.taxRate).toBe(0);
  });

  it('menggunakan 0 jika nilai NaN', () => {
    const result = AppState.setTaxRate(NaN);
    expect(result.success).toBe(false);
    expect(AppState.taxRate).toBe(0);
  });

  it('menggunakan 0 jika nilai string non-numerik', () => {
    const result = AppState.setTaxRate('abc');
    expect(result.success).toBe(false);
    expect(AppState.taxRate).toBe(0);
  });
});

describe('setTipRate', () => {
  it('mengatur tip rate yang valid', () => {
    const result = AppState.setTipRate(15);
    expect(result.success).toBe(true);
    expect(AppState.tipRate).toBe(15);
  });

  it('menggunakan 0 jika nilai negatif', () => {
    const result = AppState.setTipRate(-10);
    expect(result.success).toBe(false);
    expect(AppState.tipRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('mengembalikan semua field ke kondisi awal', () => {
    AppState.addParticipant('Alice');
    AppState.addParticipant('Bob');
    AppState.addItem('Nasi Goreng', 25000);
    AppState.setTaxRate(10);
    AppState.setTipRate(5);

    AppState.reset();

    expect(AppState.participants).toHaveLength(0);
    expect(AppState.items).toHaveLength(0);
    expect(AppState.taxRate).toBe(0);
    expect(AppState.tipRate).toBe(0);
  });

  it('memanggil listener setelah reset', () => {
    let called = false;
    AppState.subscribe(() => { called = true; });

    AppState.reset();
    expect(called).toBe(true);
  });

  it('state dapat digunakan kembali setelah reset', () => {
    AppState.addParticipant('Alice');
    AppState.reset();

    const result = AppState.addParticipant('Alice');
    expect(result.success).toBe(true);
    expect(AppState.participants).toHaveLength(1);
  });

  it('assignment dibersihkan setelah reset', () => {
    AppState.addParticipant('Alice');
    AppState.addItem('Nasi Goreng', 25000);
    AppState.assignParticipant(AppState.items[0].id, AppState.participants[0].id);

    AppState.reset();

    expect(AppState.items).toHaveLength(0);
    expect(AppState.participants).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Integrasi: full flow
// ---------------------------------------------------------------------------

describe('Full flow integration', () => {
  it('menghitung summary yang benar setelah semua mutasi', () => {
    AppState.addParticipant('Alice');
    AppState.addParticipant('Bob');
    AppState.addItem('Nasi Goreng', 25000);
    AppState.addItem('Es Teh', 5000);
    AppState.setTaxRate(10);
    AppState.setTipRate(5);

    const aliceId = AppState.participants[0].id;
    const bobId = AppState.participants[1].id;
    const nasiId = AppState.items[0].id;
    const esId = AppState.items[1].id;

    AppState.assignParticipant(nasiId, aliceId);
    AppState.assignParticipant(esId, aliceId);
    AppState.assignParticipant(esId, bobId);

    expect(AppState.participants).toHaveLength(2);
    expect(AppState.items).toHaveLength(2);
    expect(AppState.items[0].assignedTo).toContain(aliceId);
    expect(AppState.items[1].assignedTo).toContain(aliceId);
    expect(AppState.items[1].assignedTo).toContain(bobId);
  });

  it('removeParticipant membersihkan assignment dan memperbarui state', () => {
    AppState.addParticipant('Alice');
    AppState.addParticipant('Bob');
    AppState.addItem('Nasi Goreng', 25000);

    const aliceId = AppState.participants[0].id;
    const itemId = AppState.items[0].id;

    AppState.assignAll(itemId);
    expect(AppState.items[0].assignedTo).toHaveLength(2);

    AppState.removeParticipant(aliceId);
    expect(AppState.items[0].assignedTo).toHaveLength(1);
    expect(AppState.items[0].assignedTo).not.toContain(aliceId);
  });
});
