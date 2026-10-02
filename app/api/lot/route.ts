import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/format";

export async function GET() {
  const rows = await prisma.lot.findMany({
    orderBy: { id: "asc" },
    include: {
      produk: { select: { nama: true, jenis: true } },
      petani: { select: { nama: true } },
      _count: { select: { stages: true } },
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.kodeLot !== "string" || !body.kodeLot.trim()) {
    return NextResponse.json({ error: "kodeLot wajib diisi" }, { status: 400 });
  }
  const kodeLot = body.kodeLot.trim().toUpperCase();
  const produkId = Number(body.produkId);
  const petaniId = Number(body.petaniId);
  const jumlah = Number(body.jumlah);
  if (!produkId || !petaniId) {
    return NextResponse.json({ error: "produkId dan petaniId wajib diisi" }, { status: 400 });
  }
  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    return NextResponse.json({ error: "jumlah harus angka positif" }, { status: 400 });
  }
  const [produk, petani, duplikat] = await Promise.all([
    prisma.product.findUnique({ where: { id: produkId } }),
    prisma.farmer.findUnique({ where: { id: petaniId } }),
    prisma.lot.findUnique({ where: { kodeLot } }),
  ]);
  if (!produk) return NextResponse.json({ error: "produk tidak ditemukan" }, { status: 404 });
  if (!petani) return NextResponse.json({ error: "petani tidak ditemukan" }, { status: 404 });
  if (duplikat) return NextResponse.json({ error: "kodeLot sudah dipakai lot lain" }, { status: 409 });
  const created = await prisma.lot.create({
    data: {
      kodeLot,
      produkId,
      petaniId,
      tanggalProduksi: body.tanggalProduksi ?? today(),
      jumlah,
      satuan: body.satuan ?? "kg",
      createdAt: today(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
