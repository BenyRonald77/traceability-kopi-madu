import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Ubah data tahap (catatan/lokasi/pelaku/tanggal/dataPendukung).
 * Dipakai admin untuk koreksi — dan oleh test untuk mensimulasikan
 * manipulasi data, yang kemudian terdeteksi oleh verifikasi rantai.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const existing = await prisma.stage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "tahap tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body JSON tidak valid" }, { status: 400 });
  if (body.dataPendukung !== undefined && (typeof body.dataPendukung !== "object" || body.dataPendukung === null)) {
    return NextResponse.json({ error: "dataPendukung harus berupa objek JSON" }, { status: 400 });
  }
  const updated = await prisma.stage.update({
    where: { id },
    data: {
      ...(body.tanggal !== undefined ? { tanggal: String(body.tanggal) } : {}),
      ...(body.lokasi !== undefined ? { lokasi: String(body.lokasi) } : {}),
      ...(body.pelaku !== undefined ? { pelaku: String(body.pelaku) } : {}),
      ...(body.catatan !== undefined ? { catatan: String(body.catatan) } : {}),
      ...(body.dataPendukung !== undefined ? { dataPendukung: JSON.stringify(body.dataPendukung) } : {}),
    },
  });
  return NextResponse.json(updated);
}
