import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

/** SVG QR yang mengarah ke halaman verifikasi publik lot. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lotId = Number(params.id);
  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) return NextResponse.json({ error: "lot tidak ditemukan" }, { status: 404 });

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}/verifikasi/${encodeURIComponent(lot.kodeLot)}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 256 });
  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
  });
}
