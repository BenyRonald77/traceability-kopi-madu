"use client";
import { useEffect, useState } from "react";

interface Produk {
  id: number;
  nama: string;
  jenis: string;
  varian: string;
  deskripsi: string;
}

export default function ProdukPage() {
  const [rows, setRows] = useState<Produk[]>([]);
  const [form, setForm] = useState({ nama: "", jenis: "KOPI", varian: "", deskripsi: "" });
  const [err, setErr] = useState("");

  const load = () => fetch("/api/produk").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/produk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) {
      setErr((await r.json()).error);
      return;
    }
    setForm({ nama: "", jenis: "KOPI", varian: "", deskripsi: "" });
    load();
  };

  const hapus = async (id: number) => {
    const r = await fetch(`/api/produk/${id}`, { method: "DELETE" });
    if (!r.ok) setErr((await r.json()).error);
    else load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Produk</h1>
      {err && <div className="bg-red-100 text-red-800 p-2 rounded mb-3 text-sm">{err}</div>}
      <form onSubmit={submit} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-2 gap-3">
        <input className="border p-2 rounded" placeholder="Nama produk *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        <select className="border p-2 rounded" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
          <option value="KOPI">Kopi</option>
          <option value="MADU">Madu</option>
        </select>
        <input className="border p-2 rounded" placeholder="Varian (mis. Arabika Gayo)" value={form.varian} onChange={(e) => setForm({ ...form, varian: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
        <button className="bg-emerald-700 text-white px-4 py-2 rounded md:col-span-2">Tambah Produk</button>
      </form>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Jenis</th>
              <th className="text-left p-2">Varian</th>
              <th className="text-left p-2">Deskripsi</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-semibold">{p.nama}</td>
                <td className="p-2">{p.jenis === "KOPI" ? "Kopi" : "Madu"}</td>
                <td className="p-2">{p.varian}</td>
                <td className="p-2">{p.deskripsi}</td>
                <td className="p-2">
                  <button onClick={() => hapus(p.id)} className="text-red-600 underline text-xs">
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
