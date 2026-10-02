import { prisma } from "@/lib/prisma";
import { verifyChain, type StoredStage } from "@/lib/chain";
import { tahapLabel } from "@/lib/format";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Halaman verifikasi publik — bisa diakses siapa pun tanpa login (via QR kemasan). */
export default async function VerifikasiPublik({ params }: { params: { kode: string } }) {
  const kodeLot = decodeURIComponent(params.kode);
  const lot = await prisma.lot.findUnique({
    where: { kodeLot },
    include: {
      produk: true,
      petani: true,
      stages: { orderBy: { urutan: "asc" } },
    },
  });
  if (!lot) notFound();

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
  const hasil = verifyChain(lot.kodeLot, stored);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-1">🌱</div>
        <h1 className="text-2xl font-bold">Verifikasi Asal Produk</h1>
        <p className="text-slate-600 text-sm">Pindai QR pada kemasan untuk memastikan keaslian rantai pasok</p>
      </div>

      <div
        className={`rounded shadow p-4 mb-6 text-center font-bold text-lg ${
          hasil.valid ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
        }`}
      >
        {hasil.valid ? (
          <>✅ RANTAI VALID — data perjalanan produk ini terverifikasi asli</>
        ) : (
          <>
            ❌ RANTAI TIDAK VALID
            <div className="text-sm font-normal mt-1">
              Terindikasi perubahan data pada tahap {hasil.brokenAt?.urutan} (
              {tahapLabel(hasil.brokenAt?.tahap ?? "")}): {hasil.brokenAt?.reason}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="font-mono font-bold text-lg">{lot.kodeLot}</div>
        <div className="text-sm text-slate-700 mt-1">
          <span className="font-semibold">{lot.produk.nama}</span>
          {lot.produk.varian && ` — ${lot.produk.varian}`} • {lot.jumlah} {lot.satuan}
        </div>
        <div className="text-sm text-slate-700">
          Produsen: <span className="font-semibold">{lot.petani.nama}</span> ({lot.petani.lokasi})
        </div>
        <div className="text-xs text-slate-500 mt-1">Tanggal produksi: {lot.tanggalProduksi}</div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Jejak Perjalanan</h2>
      <ol className="relative border-l-2 border-emerald-700 ml-2 space-y-4 mb-8">
        {lot.stages.map((s) => (
          <li key={s.id} className="ml-4">
            <div className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full bg-emerald-700 border-2 border-white"></div>
            <div className="bg-white rounded shadow p-4">
              <div className="font-bold">
                {s.urutan}. {tahapLabel(s.tahap)}{" "}
                <span className="text-xs font-normal text-slate-500">{s.tanggal}</span>
              </div>
              <div className="text-sm text-slate-700">
                📍 {s.lokasi} • 👤 {s.pelaku}
              </div>
              {s.catatan && <div className="text-sm mt-1">{s.catatan}</div>}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-400 text-center">
        Setiap tahap diamankan dengan hash SHA-256 berantai dari tahap sebelumnya.
      </p>
    </div>
  );
}
