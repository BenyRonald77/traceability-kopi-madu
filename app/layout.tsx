import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Traceability Kopi & Madu",
  description: "Pelacakan asal-usul kopi dan madu dari petani ke pembeli dengan rantai hash",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <nav className="bg-emerald-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-4">
            <a href="/" className="font-bold text-lg">🌱 Traceability Kopi &amp; Madu</a>
            <a href="/" className="hover:underline">Dashboard</a>
            <a href="/petani" className="hover:underline">Petani</a>
            <a href="/produk" className="hover:underline">Produk</a>
            <a href="/lot" className="hover:underline">Lot</a>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
