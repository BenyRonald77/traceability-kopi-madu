# PRD — Traceability Kopi / Madu (Petani → Pembeli)

Sistem pelacakan asal-usul produk kopi dan madu per lot produksi, dengan
rantai hash SHA-256 yang menghubungkan setiap tahapan (panen → pengolahan →
pengemasan → pengiriman). Pembeli dapat memindai QR pada kemasan dan melihat
halaman verifikasi publik yang membuktikan keaslian rantai.

## Stack

Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS (App Router).
API routes di `app/api/**/route.ts`. Seed via tsx (`npm run seed`).

## Model data

- **Petani** (`Farmer`): id, nama, lokasi, telepon, jenis (`PETANI_KOPI` /
  `PETERNAK_LEBAH`), catatan. Master data produsen.
- **Produk** (`Product`): id, nama, jenis (`KOPI` / `MADU`), varian
  (mis. "Arabika Gayo", "Madu Hutan"), deskripsi.
- **Lot** (`Lot`): id, kodeLot (unik, mis. `KPI-2026-001`), produkId,
  petaniId, tanggalProduksi (YYYY-MM-DD), jumlah, satuan, tahapCount
  (penghitung tahap untuk proteksi konkurensi), createdAt.
- **Tahap** (`Stage`): id, lotId, tahap (enum `PANEN`, `PENGOLAHAN`,
  `PENGEMASAN`, `PENGIRIMAN`), urutan (1..4), tanggal, lokasi, pelaku,
  catatan, dataPendukung (JSON bebas, mis. suhu sangrai / kadar air),
  prevHash, hash.

## Aturan bisnis

1. **Urutan tahap ketat.** Tahap harus ditambahkan berurutan:
   PANEN → PENGOLAHAN → PENGEMASAN → PENGIRIMAN. Melewati tahap
   (mis. langsung PENGEMASAN tanpa PENGOLAHAN) ditolak dengan **422**.
2. **Hash berantai.** Setiap tahap menyimpan SHA-256 yang dihitung dari
   `prevHash + payload tahap dalam JSON kanonis (key terurut)`.
   Tahap pertama memakai hash genesis = SHA-256(`"GENESIS:" + kodeLot`).
   Kolom `prevHash` dan `hash` disimpan di tiap baris.
3. **Anti-konkurensi.** Penambahan tahap memakai conditional
   `updateMany` single-statement pada `Lot.tahapCount` (naik 1 hanya jika
   nilainya masih sesuai yang dibaca). Jika row terpengaruh = 0 → balapan
   terdeteksi → **409**, tahap tidak dibuat.
4. **Verifikasi rantai.** Endpoint menghitung ulang seluruh rantai dari
   genesis: setiap tahap dihitung ulang hash-nya dari data yang tersimpan
   dan dibandingkan dengan `hash` yang dicatat, serta `prevHash` harus sama
   dengan hash tahap sebelumnya. Hasil: `VALID` atau `INVALID` + penunjuk
   tahap yang rusak (urutan & jenis tahapnya).
5. **QR per lot.** Endpoint mengembalikan SVG QR yang mengarah ke halaman
   verifikasi publik `/verifikasi/[kodeLot]`.
6. **Halaman publik.** Dapat diakses tanpa login: menampilkan jejak
   perjalanan lot (panen → pengiriman), status rantai VALID/INVALID, dan
   detail tiap tahap.
7. **Hapus lot** hanya boleh jika belum punya tahap (melindungi rantai).
   Menghapus petani/produk yang masih dipakai lot ditolak (**409**).

## API

| Method | Path | Keterangan |
|---|---|---|
| GET/POST | /api/petani | list, tambah petani |
| PATCH/DELETE | /api/petani/[id] | ubah, hapus (409 jika dipakai lot) |
| GET/POST | /api/produk | list, tambah produk |
| PATCH/DELETE | /api/produk/[id] | ubah, hapus (409 jika dipakai lot) |
| GET/POST | /api/lot | list (dengan hitungan tahap & status rantai), buat lot |
| GET/PATCH/DELETE | /api/lot/[id] | detail + rantai, ubah, hapus (409 jika ada tahap) |
| POST | /api/lot/[id]/tahap | tambah tahap (422 jika urutan dilompati, 404 jika lot tidak ada, 409 jika balapan) |
| GET | /api/lot/[id]/verifikasi | verifikasi rantai → VALID/INVALID + tahap rusak |
| GET | /api/lot/[id]/qr | SVG QR → halaman verifikasi publik |
| PATCH | /api/tahap/[id] | ubah catatan/data tahap (dipakai test simulasi manipulasi) |
| GET | /verifikasi/[kodeLot] | halaman publik (HTML) |

## UI (Bahasa Indonesia)

- `/` — dashboard: statistik (petani, produk, lot, tahap), daftar lot
  dengan status rantai.
- `/petani`, `/produk` — kelola master data.
- `/lot` — daftar & tambah lot.
- `/lot/[id]` — detail lot: tambah tahap per urutan, tombol verifikasi
  rantai, unduh/cetak QR.
- `/verifikasi/[kodeLot]` — halaman publik: jejak perjalanan + status rantai.

## Seed

2 petani (1 petani kopi, 1 peternak lebah), 2 produk (kopi Arabika, madu
hutan), 3 lot: 1 lot kopi lengkap 4 tahap, 1 lot madu lengkap 4 tahap,
1 lot kopi sebagian (2 tahap).
