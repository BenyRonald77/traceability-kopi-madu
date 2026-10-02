import { PrismaClient } from "@prisma/client";
import { STAGE_ORDER, genesisHash, stageHash, type StagePayload } from "../lib/chain";

const prisma = new PrismaClient();

interface SeedStage {
  tahap: string;
  tanggal: string;
  lokasi: string;
  pelaku: string;
  catatan: string;
  dataPendukung: Record<string, unknown>;
}

async function addStage(lotId: number, kodeLot: string, urutan: number, s: SeedStage) {
  const prev =
    urutan === 1
      ? genesisHash(kodeLot)
      : (await prisma.stage.findUniqueOrThrow({ where: { lotId_urutan: { lotId, urutan: urutan - 1 } } })).hash;
  const payload: StagePayload = {
    kodeLot,
    tahap: s.tahap,
    tanggal: s.tanggal,
    lokasi: s.lokasi,
    pelaku: s.pelaku,
    catatan: s.catatan,
    dataPendukung: s.dataPendukung,
  };
  const hash = stageHash(prev, payload);
  await prisma.stage.create({
    data: {
      lotId,
      tahap: s.tahap,
      urutan,
      tanggal: s.tanggal,
      lokasi: s.lokasi,
      pelaku: s.pelaku,
      catatan: s.catatan,
      dataPendukung: JSON.stringify(s.dataPendukung),
      prevHash: prev,
      hash,
    },
  });
  await prisma.lot.update({ where: { id: lotId }, data: { tahapCount: urutan } });
}

async function main() {
  const n = await prisma.lot.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  const petaniKopi = await prisma.farmer.create({
    data: {
      nama: "Slamet Riyadi",
      lokasi: "Gayo, Aceh Tengah",
      telepon: "0812-3456-7890",
      jenis: "PETANI_KOPI",
      catatan: "Petani kopi Arabika Gayo, kebun 2 hektar",
    },
  });
  const peternakLebah = await prisma.farmer.create({
    data: {
      nama: "Haji Mahmud",
      lokasi: "Sumbawa, NTB",
      telepon: "0813-9876-5432",
      jenis: "PETERNAK_LEBAH",
      catatan: "Peternak lebah hutan Sumbawa, 120 stup",
    },
  });

  const kopi = await prisma.product.create({
    data: { nama: "Kopi Arabika Gayo", jenis: "KOPI", varian: "Arabika Gayo", deskripsi: "Biji kopi arabika single origin dataran tinggi Gayo" },
  });
  const madu = await prisma.product.create({
    data: { nama: "Madu Hutan Sumbawa", jenis: "MADU", varian: "Madu Hutan", deskripsi: "Madu hutan murni dari lebah Apis dorsata" },
  });

  // Lot 1: kopi lengkap 4 tahap
  const lot1 = await prisma.lot.create({
    data: {
      kodeLot: "KPI-2026-001",
      produkId: kopi.id,
      petaniId: petaniKopi.id,
      tanggalProduksi: "2026-09-20",
      jumlah: 500,
      satuan: "kg",
      createdAt: "2026-09-20",
    },
  });
  const lot1Stages: SeedStage[] = [
    {
      tahap: "PANEN",
      tanggal: "2026-09-20",
      lokasi: "Kebun Gayo, Aceh Tengah",
      pelaku: "Slamet Riyadi",
      catatan: "Panen ceri merah pilihan, petik manual",
      dataPendukung: { metode: "petik manual", brix: 22, cuaca: "cerah" },
    },
    {
      tahap: "PENGOLAHAN",
      tanggal: "2026-09-22",
      lokasi: "Pabrik pengolahan Gayo",
      pelaku: "Tim pengolahan Gayo",
      catatan: "Proses full-washed, fermentasi 36 jam",
      dataPendukung: { metode: "full-washed", fermentasi_jam: 36, kadar_air_awal: 55 },
    },
    {
      tahap: "PENGEMASAN",
      tanggal: "2026-09-25",
      lokasi: "Gudang kemas Banda Aceh",
      pelaku: "Tim kemas",
      catatan: "Dikemas dalam karung 60 kg berlapis grainpro",
      dataPendukung: { kemasan: "karung 60kg grainpro", kadar_air_akhir: 11.5, jumlah_karung: 8 },
    },
    {
      tahap: "PENGIRIMAN",
      tanggal: "2026-09-28",
      lokasi: "Banda Aceh → Jakarta",
      pelaku: "Ekspedisi Nusantara",
      catatan: "Dikirim via truk kontainer, resi NST-88213",
      dataPendukung: { ekspedisi: "Nusantara", resi: "NST-88213", armada: "truk kontainer" },
    },
  ];
  for (let i = 0; i < lot1Stages.length; i++) await addStage(lot1.id, lot1.kodeLot, i + 1, lot1Stages[i]);

  // Lot 2: madu lengkap 4 tahap
  const lot2 = await prisma.lot.create({
    data: {
      kodeLot: "MDU-2026-001",
      produkId: madu.id,
      petaniId: peternakLebah.id,
      tanggalProduksi: "2026-09-15",
      jumlah: 200,
      satuan: "botol",
      createdAt: "2026-09-15",
    },
  });
  const lot2Stages: SeedStage[] = [
    {
      tahap: "PANEN",
      tanggal: "2026-09-15",
      lokasi: "Hutan Sumbawa, NTB",
      pelaku: "Haji Mahmud",
      catatan: "Panen sarang lebah hutan secara lestari",
      dataPendukung: { metode: "lestari", jumlah_stup: 40 },
    },
    {
      tahap: "PENGOLAHAN",
      tanggal: "2026-09-16",
      lokasi: "Rumah produksi Sumbawa",
      pelaku: "Tim produksi Mahmud",
      catatan: "Diperas dingin dan disaring dua tahap",
      dataPendukung: { metode: "peras dingin", saring: "2 tahap" },
    },
    {
      tahap: "PENGEMASAN",
      tanggal: "2026-09-18",
      lokasi: "Rumah produksi Sumbawa",
      pelaku: "Tim kemas",
      catatan: "Dikemas dalam botol kaca 500 ml bersegel",
      dataPendukung: { kemasan: "botol kaca 500ml", segel: true, jumlah_botol: 200 },
    },
    {
      tahap: "PENGIRIMAN",
      tanggal: "2026-09-21",
      lokasi: "Sumbawa → Surabaya",
      pelaku: "Kargo Cepat",
      catatan: "Dikirim via kargo udara, resi KCP-55190",
      dataPendukung: { ekspedisi: "Kargo Cepat", resi: "KCP-55190" },
    },
  ];
  for (let i = 0; i < lot2Stages.length; i++) await addStage(lot2.id, lot2.kodeLot, i + 1, lot2Stages[i]);

  // Lot 3: kopi sebagian (2 tahap)
  const lot3 = await prisma.lot.create({
    data: {
      kodeLot: "KPI-2026-002",
      produkId: kopi.id,
      petaniId: petaniKopi.id,
      tanggalProduksi: "2026-09-29",
      jumlah: 300,
      satuan: "kg",
      createdAt: "2026-09-29",
    },
  });
  const lot3Stages: SeedStage[] = [
    {
      tahap: "PANEN",
      tanggal: "2026-09-29",
      lokasi: "Kebun Gayo, Aceh Tengah",
      pelaku: "Slamet Riyadi",
      catatan: "Panen ceri merah pilihan",
      dataPendukung: { metode: "petik manual", brix: 21 },
    },
    {
      tahap: "PENGOLAHAN",
      tanggal: "2026-09-30",
      lokasi: "Pabrik pengolahan Gayo",
      pelaku: "Tim pengolahan Gayo",
      catatan: "Proses natural, penjemuran 14 hari",
      dataPendukung: { metode: "natural", jemur_hari: 14 },
    },
  ];
  for (let i = 0; i < lot3Stages.length; i++) await addStage(lot3.id, lot3.kodeLot, i + 1, lot3Stages[i]);

  console.log(`seed selesai: 2 petani, 2 produk, 3 lot (tahap: ${STAGE_ORDER.length} maks per lot)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
