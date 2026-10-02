import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STAGE_ORDER, genesisHash, stageHash, type StagePayload } from "@/lib/chain";
import { today } from "@/lib/format";

/**
 * Tambah tahap ke lot dengan hash berantai.
 * Atomik terhadap konkurensi: conditional updateMany single-statement
 * menaikkan Lot.tahapCount hanya jika nilainya masih sesuai yang dibaca.
 * Jika row terpengaruh = 0 → balapan terdeteksi → 409.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const lotId = Number(params.id);
  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) return NextResponse.json({ error: "lot tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body JSON tidak valid" }, { status: 400 });

  const tahap = String(body.tahap ?? "").toUpperCase();
  const expectedIndex = lot.tahapCount; // 0-based: tahap berikutnya yang boleh
  if (expectedIndex >= STAGE_ORDER.length) {
    return NextResponse.json({ error: "rantai lot sudah lengkap (4 tahap)" }, { status: 422 });
  }
  const expectedTahap = STAGE_ORDER[expectedIndex];
  if (tahap !== expectedTahap) {
    return NextResponse.json(
      {
        error: `urutan tahap dilompati: tahap berikutnya harus ${expectedTahap}, bukan ${tahap || "(kosong)"}`,
      },
      { status: 422 }
    );
  }

  const dataPendukung = body.dataPendukung ?? {};
  if (typeof dataPendukung !== "object" || dataPendukung === null) {
    return NextResponse.json({ error: "dataPendukung harus berupa objek JSON" }, { status: 400 });
  }

  // Kunci atomik: naikkan tahapCount secara kondisional dalam satu statement.
  const kunci = await prisma.lot.updateMany({
    where: { id: lotId, tahapCount: expectedIndex },
    data: { tahapCount: expectedIndex + 1 },
  });
  if (kunci.count === 0) {
    return NextResponse.json(
      { error: "terdeteksi penulisan bersamaan, silakan ulangi" },
      { status: 409 }
    );
  }

  const urutan = expectedIndex + 1;
  let prevHash: string;
  if (urutan === 1) {
    prevHash = genesisHash(lot.kodeLot);
  } else {
    const prev = await prisma.stage.findUnique({
      where: { lotId_urutan: { lotId, urutan: urutan - 1 } },
    });
    if (!prev) {
      // Rollback penghitung agar konsisten (seharusnya tidak terjadi)
      await prisma.lot.updateMany({ where: { id: lotId, tahapCount: urutan }, data: { tahapCount: urutan - 1 } });
      return NextResponse.json({ error: "tahap sebelumnya tidak ditemukan" }, { status: 422 });
    }
    prevHash = prev.hash;
  }

  const payload: StagePayload = {
    kodeLot: lot.kodeLot,
    tahap,
    tanggal: body.tanggal ?? today(),
    lokasi: body.lokasi ?? "",
    pelaku: body.pelaku ?? "",
    catatan: body.catatan ?? "",
    dataPendukung,
  };
  const hash = stageHash(prevHash, payload);

  try {
    const created = await prisma.stage.create({
      data: {
        lotId,
        tahap,
        urutan,
        tanggal: payload.tanggal,
        lokasi: payload.lokasi,
        pelaku: payload.pelaku,
        catatan: payload.catatan,
        dataPendukung: JSON.stringify(dataPendukung),
        prevHash,
        hash,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    // Rollback penghitung bila create gagal (mis. unique constraint)
    await prisma.lot.updateMany({ where: { id: lotId, tahapCount: urutan }, data: { tahapCount: urutan - 1 } });
    return NextResponse.json({ error: "gagal menyimpan tahap" }, { status: 409 });
  }
}
