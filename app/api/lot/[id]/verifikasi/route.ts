import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyChain, type StoredStage } from "@/lib/chain";

/** Verifikasi ulang seluruh rantai hash lot dari genesis. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lotId = Number(params.id);
  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { stages: { orderBy: { urutan: "asc" } } },
  });
  if (!lot) return NextResponse.json({ error: "lot tidak ditemukan" }, { status: 404 });

  const stored: StoredStage[] = lot.stages.map((s) => ({
    id: s.id,
    tahap: s.tahap,
    tanggal: s.tanggal,
    lokasi: s.lokasi,
    pelaku: s.pelaku,
    catatan: s.catatan,
    dataPendukung: s.dataPendukung,
    prevHash: s.prevHash,
    hash: s.hash,
  }));
  const result = verifyChain(lot.kodeLot, stored);
  return NextResponse.json({
    kodeLot: lot.kodeLot,
    jumlahTahap: stored.length,
    ...result,
    status: result.valid ? "VALID" : "INVALID",
  });
}
