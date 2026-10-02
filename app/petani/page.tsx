"use client";
import { useEffect, useState } from "react";

interface Petani {
  id: number;
  nama: string;
  lokasi: string;
  telepon: string;
  jenis: string;
  catatan: string;
}

const JENIS = ["PETANI_KOPI", "PETERNAK_LEBAH"];

export default function PetaniPage() {
  const [rows, setRows] = useState<Petani[]>([]);
  const [form, setForm] = useState({ nama: "", lokasi: "", telepon: "", jenis: "PETANI_KOPI", catatan: "" });
  const [err, setErr] = useState("");

  const load = () => fetch("/api/petani").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/petani", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!r.ok) {
      setErr((await r.json()).error);
      return;
    }
    setForm({ nama: "", lokasi: "", telepon: "", jenis: "PETANI_KOPI", catatan: "" });
    load();
  };

  const hapus = async (id: number) => {
    const r = await fetch(`/api/petani/${id}`, { method: "DELETE" });
    if (!r.ok) setErr((await r.json()).error);
    else load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Petani / Peternak Lebah</h1>
      {err && <div className="bg-red-100 text-red-800 p-2 rounded mb-3 text-sm">{err}</div>}
      <form onSubmit={submit} className="bg-white rounded shadow p-4 mb-6 grid md:grid-cols-2 gap-3">
        <input className="border p-2 rounded" placeholder="Nama *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Lokasi" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Telepon" value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
        <select className="border p-2 rounded" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
          {JENIS.map((j) => (
            <option key={j} value={j}>
              {j === "PETANI_KOPI" ? "Petani Kopi" : "Peternak Lebah"}
            </option>
          ))}
        </select>
        <input className="border p-2 rounded md:col-span-2" placeholder="Catatan" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
        <button className="bg-emerald-700 text-white px-4 py-2 rounded md:col-span-2">Tambah Petani</button>
      </form>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Nama</th>
              <th className="text-left p-2">Jenis</th>
              <th className="text-left p-2">Lokasi</th>
              <th className="text-left p-2">Telepon</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-semibold">{p.nama}</td>
                <td className="p-2">{p.jenis === "PETANI_KOPI" ? "Petani Kopi" : "Peternak Lebah"}</td>
                <td className="p-2">{p.lokasi}</td>
                <td className="p-2">{p.telepon}</td>
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
