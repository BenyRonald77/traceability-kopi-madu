"use client";
import { useEffect, useState } from "react";
import { tahapLabel, today } from "@/lib/format";

const ORDER = ["PANEN", "PENGOLAHAN", "PENGEMASAN", "PENGIRIMAN"];

interface Stage {
  id: number;
  tahap: string;
  urutan: number;
  tanggal: string;
  lokasi: string;
  pelaku: string;
  catatan: string;
  dataPendukung: string;
  prevHash: string;
  hash: string;
}

interface LotDetail {
  id: number;
  kodeLot: string;
  tanggalProduksi: string;
  jumlah: number;
  satuan: string;
  produk: { nama: string; jenis: string; varian: string };
  petani: { nama: string; lokasi: string };
  stages: Stage[];
}

export default function LotDetailPage({ params }: { params: { id: string } }) {
  const [lot, setLot] = useState<LotDetail | null>(null);
  const [err, setErr] = useState("");
  const [verif, setVerif] = useState<{ status: string; brokenAt: { urutan: number; tahap: string; reason: string } | null } | null>(null);
  const [qr, setQr] = useState("");
  const [form, setForm] = useState({ tanggal: today(), lokasi: "", pelaku: "", catatan: "", dataPendukung: "{}" });

  const load = () => fetch(`/api/lot/${params.id}`).then((r) => r.json()).then(setLot);
  useEffect(() => {
    load();
    fetch(`/api/lot/${params.id}/qr`)
      .then((r) => r.text())
      .then((svg) => setQr("data:image/svg+xml," + encodeURIComponent(svg)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const nextTahap = lot ? ORDER[lot.stages.length] : null;

  const tambahTahap = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    let dp: unknown = {};
    try {
      dp = JSON.parse(form.dataPendukung || "{}");
    } catch {
      setErr("dataPendukung bukan JSON valid");
      return;
    }
    const r = await fetch(`/api/lot/${params.id}/tahap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tahap: nextTahap, ...form, dataPendukung: dp }),
    });
    if (!r.ok) {
      setErr((await r.json()).error);
      return;
    }
    setForm({ tanggal: today(), lokasi: "", pelaku: "", catatan: "", dataPendukung: "{}" });
    setVerif(null);
    load();
  };

  const cekRantai = async () => {
    const r = await fetch(`/api/lot/${params.id}/verifikasi`).then((x) => x.json());
    setVerif(r);
  };

  if (!lot) return <div>Memuat…</div>;

  return (
    <div>
      <a href="/lot" className="text-emerald-700 underline text-sm">
        ← kembali ke daftar lot
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-1 font-mono">{lot.kodeLot}</h1>
      <p className="text-sm text-slate-600 mb-4">
        {lot.produk.nama} ({lot.produk.varian}) • {lot.jumlah} {lot.satuan} • {lot.petani.nama},{" "}
        {lot.petani.lokasi}
      </p>

      {err && <div className="bg-red-100 text-red-800 p-2 rounded mb-3 text-sm">{err}</div>}

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={cekRantai} className="bg-emerald-700 text-white px-4 py-2 rounded">
          Verifikasi Rantai
        </button>
        {verif && (
          <div
            className={`px-4 py-2 rounded font-bold ${
              verif.status === "VALID" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}
          >
            {verif.status === "VALID"
              ? "✅ Rantai VALID"
              : `❌ Rantai INVALID — rusak di tahap ${verif.brokenAt?.urutan} (${tahapLabel(verif.brokenAt?.tahap ?? "")}): ${verif.brokenAt?.reason}`}
          </div>
        )}
      </div>

      {qr && (
        <div className="bg-white rounded shadow p-4 mb-6 inline-block">
          <div className="text-sm font-semibold mb-2">QR Verifikasi Publik</div>
          <img src={qr} alt={`QR lot ${lot.kodeLot}`} className="w-48 h-48" />
          <div className="mt-2 flex gap-2">
            <a href={`/api/lot/${lot.id}/qr`} download={`qr-${lot.kodeLot}.svg`} className="text-emerald-700 underline text-sm">
              unduh SVG
            </a>
            <a href={`/verifikasi/${lot.kodeLot}`} target="_blank" className="text-emerald-700 underline text-sm">
              buka halaman publik
            </a>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-3">Jejak Tahapan ({lot.stages.length}/4)</h2>
      <div className="space-y-3 mb-8">
        {lot.stages.map((s) => (
          <div key={s.id} className="bg-white rounded shadow p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-800 text-white text-xs font-bold px-2 py-1 rounded">
                {s.urutan}. {tahapLabel(s.tahap)}
              </span>
              <span className="text-xs text-slate-500">{s.tanggal}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">Lokasi:</span> {s.lokasi} • <span className="font-semibold">Pelaku:</span> {s.pelaku}
            </div>
            {s.catatan && <div className="text-sm mt-1">{s.catatan}</div>}
            <details className="text-xs mt-2 text-slate-600">
              <summary className="cursor-pointer text-emerald-700">data pendukung &amp; hash</summary>
              <pre className="bg-slate-100 p-2 rounded mt-1 overflow-x-auto">{s.dataPendukung}</pre>
              <div className="font-mono break-all mt-1">
                <div>prev: {s.prevHash.slice(0, 32)}…</div>
                <div>hash: {s.hash.slice(0, 32)}…</div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {nextTahap && (
        <div className="bg-white rounded shadow p-4 mb-8">
          <h3 className="font-semibold mb-3">Tambah Tahap: {tahapLabel(nextTahap)}</h3>
          <form onSubmit={tambahTahap} className="grid md:grid-cols-2 gap-3">
            <input type="date" className="border p-2 rounded" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Lokasi" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Pelaku" value={form.pelaku} onChange={(e) => setForm({ ...form, pelaku: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
            <textarea className="border p-2 rounded md:col-span-2 font-mono text-xs" rows={3} placeholder='Data pendukung JSON, mis. {"suhu": 205}' value={form.dataPendukung} onChange={(e) => setForm({ ...form, dataPendukung: e.target.value })} />
            <button className="bg-emerald-700 text-white px-4 py-2 rounded md:col-span-2">Simpan Tahap</button>
          </form>
        </div>
      )}
    </div>
  );
}
