import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const JENIS_VALID = ["KOPI", "MADU"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "produk tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body JSON tidak valid" }, { status: 400 });
  if (body.jenis && !JENIS_VALID.includes(body.jenis)) {
    return NextResponse.json({ error: `jenis harus salah satu: ${JENIS_VALID.join(", ")}` }, { status: 400 });
  }
  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(body.nama !== undefined ? { nama: String(body.nama).trim() } : {}),
      ...(body.jenis !== undefined ? { jenis: body.jenis } : {}),
      ...(body.varian !== undefined ? { varian: String(body.varian) } : {}),
      ...(body.deskripsi !== undefined ? { deskripsi: String(body.deskripsi) } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "produk tidak ditemukan" }, { status: 404 });
  const dipakai = await prisma.lot.count({ where: { produkId: id } });
  if (dipakai > 0) {
    return NextResponse.json({ error: `produk masih dipakai ${dipakai} lot, tidak bisa dihapus` }, { status: 409 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
