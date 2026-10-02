import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lot = await prisma.lot.findUnique({
    where: { id },
    include: {
      produk: true,
      petani: true,
      stages: { orderBy: { urutan: "asc" } },
    },
  });
  if (!lot) return NextResponse.json({ error: "lot tidak ditemukan" }, { status: 404 });
  return NextResponse.json(lot);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot) return NextResponse.json({ error: "lot tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body JSON tidak valid" }, { status: 400 });
  if (body.jumlah !== undefined && (!Number.isFinite(Number(body.jumlah)) || Number(body.jumlah) <= 0)) {
    return NextResponse.json({ error: "jumlah harus angka positif" }, { status: 400 });
  }
  const updated = await prisma.lot.update({
    where: { id },
    data: {
      ...(body.tanggalProduksi !== undefined ? { tanggalProduksi: String(body.tanggalProduksi) } : {}),
      ...(body.jumlah !== undefined ? { jumlah: Number(body.jumlah) } : {}),
      ...(body.satuan !== undefined ? { satuan: String(body.satuan) } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const lot = await prisma.lot.findUnique({ where: { id }, include: { _count: { select: { stages: true } } } });
  if (!lot) return NextResponse.json({ error: "lot tidak ditemukan" }, { status: 404 });
  if (lot._count.stages > 0) {
    return NextResponse.json(
      { error: `lot sudah memiliki ${lot._count.stages} tahap rantai, tidak bisa dihapus` },
      { status: 409 }
    );
  }
  await prisma.lot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
