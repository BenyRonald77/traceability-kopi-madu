# Traceability Kopi & Madu

Sistem pelacakan asal-usul produk kopi dan madu dari petani/peternak lebah
sampai ke pembeli. Setiap lot produksi memiliki rantai tahapan
**panen → pengolahan → pengemasan → pengiriman**, dan setiap tahap diamankan
dengan **hash SHA-256 berantai** (hash tahap ini dihitung dari hash tahap
sebelumnya + data tahap dalam JSON kanonis).

Pembeli memindai **QR pada kemasan** → membuka halaman verifikasi publik yang
menampilkan jejak perjalanan lot beserta status rantai **VALID / INVALID**.
Jika ada data tahap yang diubah setelah dicatat, verifikasi akan mendeteksi
dan menunjukkan tahap mana yang rusak.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000

Catatan: `npm install --ignore-scripts` bila unduhan binary Prisma gagal,
lalu salin `schema-engine` + `libquery_engine` yang sesuai ke
`node_modules/@prisma/engines/` sebelum `npx prisma generate`.

## Halaman

| Route | Keterangan |
|---|---|
| `/` | Dashboard: statistik + daftar lot + tombol verifikasi rantai |
| `/petani` | Kelola master petani / peternak lebah |
| `/produk` | Kelola master produk kopi / madu |
| `/lot` | Daftar & tambah lot produksi |
| `/lot/[id]` | Detail lot: tambah tahap berurutan, verifikasi rantai, QR |
| `/verifikasi/[kodeLot]` | **Publik** (tanpa login): jejak perjalanan + status rantai |

## API

- `GET/POST /api/petani`, `PATCH/DELETE /api/petani/[id]`
- `GET/POST /api/produk`, `PATCH/DELETE /api/produk/[id]`
- `GET/POST /api/lot`, `GET/PATCH/DELETE /api/lot/[id]`
- `POST /api/lot/[id]/tahap` — tambah tahap; **422** jika urutan dilompati
  atau rantai sudah lengkap; **404** jika lot tidak ada; **409** jika
  terdeteksi penulisan bersamaan
- `GET /api/lot/[id]/verifikasi` — hitung ulang rantai dari genesis →
  `VALID` / `INVALID` + penunjuk tahap yang rusak
- `GET /api/lot/[id]/qr` — SVG QR menuju halaman verifikasi publik
- `PATCH /api/tahap/[id]` — koreksi data tahap (dipakai test simulasi manipulasi)

## Aturan bisnis

1. Tahap harus berurutan: PANEN → PENGOLAHAN → PENGEMASAN → PENGIRIMAN.
   Melewati tahap ditolak dengan 422.
2. Hash tiap tahap = SHA-256(prevHash + "|" + JSON-kanonis(payload));
   tahap pertama memakai genesis = SHA-256("GENESIS:" + kodeLot).
3. Penambahan tahap memakai conditional `updateMany` single-statement pada
   `Lot.tahapCount` agar tahan terhadap penulisan bersamaan (bukan
   interactive transaction).
4. Lot yang sudah punya tahap tidak bisa dihapus (409); petani/produk yang
   masih dipakai lot tidak bisa dihapus (409).

## Seed

2 petani (kopi + lebah), 2 produk (Arabika Gayo + Madu Hutan Sumbawa), 3 lot:
`KPI-2026-001` (kopi, 4 tahap lengkap), `MDU-2026-001` (madu, 4 tahap lengkap),
`KPI-2026-002` (kopi, 2 tahap).
