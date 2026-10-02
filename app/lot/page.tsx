"use client";
import { useEffect, useState } from "react";
import { today } from "@/lib/format";

interface LotRow {
  id: number;
  kodeLot: string;
  tanggalProduksi: string;
  jumlah: number;
  satuan: string;
  produk: { nama: string };
  petani: { nama: string };
  _count: { stages: number };
}

export default function LotPage() {
  const [lots, setLots] = useState<LotRow[]>([]);
  const [produks, setProduks] = useState<{ id: number; nama: string }[]>([]);
  const [petanis, setPetanis] = useState<{ id: number; nama: string }[]>([]);
  const [form, setForm] = useState({ kodeLot: "", produkId: "", petaniId: "", tanggalProduksi: today(), jumlah: "", satuan: "kg" });
  const [err, setErr] = useState("");

  const load = async () => {
    const [rl, rp, rf] = await Promise.all([
      fetch("/api/lot").then((r) => r.json()),
      fetch("/api/produk").then((r) => r.json()),
      fetch("/api/petani").then((r) => r.json()),
    ]);
    setLots(rl);
    setProduks(rp);
    setPetanis(rf);
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/lot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, produkId: Number(form.produkId), petaniId: Number(form.petaniId), jumlah: Number(form.jumlah) }),
    });
    if (!r.ok) {
      setErr((await r.json()).error);
      return;
    }
    setForm({ kodeLot: "", produkId: "", petaniId: "", tanggalProduksi: today(), jumlah: "", satuan: "kg" });
    load();
  };

  const hapus = async (id: number) => {
    const r = await fetch(`/api/lot/${id}`, { method: "DELETE" });
    if (!r.ok) setErr((await r.json()).error);
    else load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lot Produksi</h1>
      {err && <div className="bg-red-100 text-red-800 p-2 rounded mb-3 text-sm">{err}</div>}
      <form onSubmit={submit} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-3 gap-3">
        <input className="border p-2 rounded" placeholder="Kode lot * (mis. KPI-2026-003)" value={form.kodeLot} onChange={(e) => setForm({ ...form, kodeLot: e.target.value })} required />
        <select className="border p-2 rounded" value={form.produkId} onChange={(e) => setForm({ ...form, produkId: e.target.value })} required>
          <option value="">— Pilih produk —</option>
          {produks.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
        <select className="border p-2 rounded" value={form.petaniId} onChange={(e) => setForm({ ...form, petaniId: e.target.value })} required>
          <option value="">— Pilih petani —</option>
          {petanis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
        <input type="date" className="border p-2 rounded" value={form.tanggalProduksi} onChange={(e) => setForm({ ...form, tanggalProduksi: e.target.value })} />
        <input type="number" step="any" min="0" className="border p-2 rounded" placeholder="Jumlah *" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Satuan (kg/botol)" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} />
        <button className="bg-emerald-700 text-white px-4 py-2 rounded md:col-span-3">Tambah Lot</button>
      </form>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Kode Lot</th>
              <th className="text-left p-2">Produk</th>
              <th className="text-left p-2">Petani</th>
              <th className="text-left p-2">Jumlah</th>
              <th className="text-left p-2">Tahap</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono font-semibold">{l.kodeLot}</td>
                <td className="p-2">{l.produk.nama}</td>
                <td className="p-2">{l.petani.nama}</td>
                <td className="p-2">
                  {l.jumlah} {l.satuan}
                </td>
                <td className="p-2">{l._count.stages}/4</td>
                <td className="p-2 flex gap-2">
                  <a href={`/lot/${l.id}`} className="text-emerald-700 underline">
                    kelola tahap
                  </a>
                  <button onClick={() => hapus(l.id)} className="text-red-600 underline text-xs">
                    hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
