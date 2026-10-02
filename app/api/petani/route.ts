import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const JENIS_VALID = ["PETANI_KOPI", "PETERNAK_LEBAH"];

export async function GET() {
  const rows = await prisma.farmer.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.nama !== "string" || !body.nama.trim()) {
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  }
  const jenis = body.jenis ?? "PETANI_KOPI";
  if (!JENIS_VALID.includes(jenis)) {
    return NextResponse.json({ error: `jenis harus salah satu: ${JENIS_VALID.join(", ")}` }, { status: 400 });
  }
  const created = await prisma.farmer.create({
    data: {
      nama: body.nama.trim(),
      lokasi: body.lokasi ?? "",
      telepon: body.telepon ?? "",
      jenis,
      catatan: body.catatan ?? "",
    },
  });
  return NextResponse.json(created, { status: 201 });
}
