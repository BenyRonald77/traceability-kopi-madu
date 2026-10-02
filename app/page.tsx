"use client";
import { useEffect, useState } from "react";
import { tahapLabel } from "@/lib/format";

interface LotRow {
  id: number;
  kodeLot: string;
  tanggalProduksi: string;
  jumlah: number;
  satuan: string;
  produk: { nama: string; jenis: string };
  petani: { nama: string };
  _count: { stages: number };
}

export default function Dashboard() {
  const [lots, setLots] = useState<LotRow[]>([]);
  const [petani, setPetani] = useState(0);
  const [produk, setProduk] = useState(0);
  const [verif, setVerif] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      const [rl, rp, rf] = await Promise.all([
        fetch("/api/lot").then((r) => r.json()),
        fetch("/api/produk").then((r) => r.json()),
        fetch("/api/petani").then((r) => r.json()),
      ]);
      setLots(rl);
      setProduk(rp.length);
      setPetani(rf.length);
    })();
  }, []);

  const cek = async (id: number) => {
    const r = await fetch(`/api/lot/${id}/verifikasi`).then((x) => x.json());
    setVerif((v) => ({ ...v, [id]: r.status }));
  };

  const totalTahap = lots.reduce((a, l) => a + l._count.stages, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Traceability</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ["Petani/Peternak", petani],
          ["Produk", produk],
          ["Lot", lots.length],
          ["Tahap Tercatat", totalTahap],
        ].map(([label, n]) => (
          <div key={label as string} className="bg-white rounded shadow p-4">
            <div className="text-3xl font-bold text-emerald-800">{n}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <h2 className="text-xl font-semibold mb-3">Daftar Lot</h2>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Kode Lot</th>
              <th className="text-left p-2">Produk</th>
              <th className="text-left p-2">Petani</th>
              <th className="text-left p-2">Tahap</th>
              <th className="text-left p-2">Rantai</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono font-semibold">{l.kodeLot}</td>
                <td className="p-2">{l.produk.nama}</td>
                <td className="p-2">{l.petani.nama}</td>
                <td className="p-2">{l._count.stages}/4</td>
                <td className="p-2">
                  {verif[l.id] ? (
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        verif[l.id] === "VALID" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {verif[l.id]}
                    </span>
                  ) : (
                    <button onClick={() => cek(l.id)} className="text-emerald-700 underline text-xs">
                      verifikasi
                    </button>
                  )}
                </td>
                <td className="p-2">
                  <a href={`/lot/${l.id}`} className="text-emerald-700 underline">
                    detail
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Halaman verifikasi publik pembeli: <span className="font-mono">/verifikasi/[kode-lot]</span> (dapat
        diakses lewat QR pada kemasan).
      </p>
    </div>
  );
}
